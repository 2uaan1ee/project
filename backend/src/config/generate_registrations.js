// generate_registrations.js
// Sinh dữ liệu phiếu đăng ký học phần HK2 2025-2026 cho ~2000 sinh viên.
// Chạy: node generate_registrations.js

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");
require("dotenv").config();

// =========================
// CẤU HÌNH CƠ BẢN
// =========================

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || "quanlene-db";

// Năm học hiện tại: 2025-2026, đang ở học kỳ 2
const CURRENT_ACADEMIC_YEAR = 2025;
const ACADEMIC_YEAR_LABEL = "2025-2026";
const CURRENT_SEMESTER = 2;

// Giới hạn tín chỉ
const MIN_CREDITS = 14;
const MAX_CREDITS = 24;

// Số sinh viên tối đa muốn sinh (null = không giới hạn)
const MAX_STUDENTS = null;

// Thư mục chứa các file JSON CTĐT
const DATA_DIR = path.join(__dirname, "data");

// Học phí (trích từ biểu mẫu)
const TUITION_THEORY_PER_CREDIT = 27000;
const TUITION_PRACTICE_PER_CREDIT = 37000;

// Cửa sổ đăng ký (dùng cho registered_at)
const REG_WINDOW_START = new Date("2025-01-05T08:00:00+07:00");
const REG_WINDOW_END = new Date("2025-01-20T23:59:59+07:00");

// Collection names (đổi nếu DB bạn khác)
const STUDENTS_COLLECTION = "students_v2.0";
const SUBJECTS_COLLECTION = "subject"; // bạn đang log "collection subject" -> để mặc định "subject"
const REG_COLLECTION = "course_registrations";

// =========================
// CURSOR & BATCH CONFIG
// =========================

// số document MongoDB trả về mỗi lần
const CURSOR_BATCH_SIZE = 1000;

// số phiếu upsert mỗi lần (bulkWrite)
const UPSERT_BATCH_SIZE = 1000;

// đếm warning thiếu môn
const missingCounter = { count: 0 };

// =========================
// MAPPING NGÀNH & KHOA
// =========================

// Tên ngành (trong JSON CTĐT) -> mã ngành (trong students)
const MAJOR_NAME_TO_CODE = {
    "An toàn thông tin": "ATTT",
    "Công nghệ thông tin": "CNTT",
    "Công nghệ thông tin Việt Nhật": "CNTT",
    "Hệ thống thông tin": "HTTT",
    "Hệ thống thông tin tiên tiến": "HTTT",
    "Khoa học dữ liệu": "KHDL",
    "Khoa học máy tính": "KHMT",
    "Kỹ thuật máy tính": "KTMT",
    "Kỹ thuật phần mềm": "KTPM",
    "Mạng máy tính và truyền thông dữ liệu": "MMTT",
    "Thiết kế Vi mạch": "TKVM",
    "Thương mại điện tử": "TMDT",
    "Truyền thông đa phương tiện": "TTDT",
    "Trí tuệ nhân tạo": "TTNT",
};

// Mã ngành -> faculty_id naming nội bộ trong subjects
// (theo bạn yêu cầu: "KHOA_MMT&TT": "Mạng Máy Tính & Truyền Thông")
const MAJOR_CODE_TO_FACULTY_ID = {
    // MMT&TT
    ATTT: "KHOA_MMT&TT",
    MMTT: "KHOA_MMT&TT",
    TTDT: "KHOA_MMT&TT",

    // KTTT
    CNTT: "KHOA_KTTT",
    KHDL: "KHOA_KTTT",

    // HTTT
    HTTT: "KHOA_HTTT",
    TMDT: "KHOA_HTTT",

    // KHMT
    KHMT: "KHOA_KHMT",
    TTNT: "KHOA_KHMT",

    // CNPM
    KTPM: "KHOA_CNPM",

    // KTMT
    KTMT: "KHOA_KTMT",
    TKVM: "KHOA_KTMT",
};

// =========================
// HÀM TIỆN ÍCH
// =========================

function normalizeSubjectId(id) {
    if (!id) return "";
    // Xoá khoảng trắng, dấu gạch, chấm… để match "CS 5000" -> "CS5000"
    return String(id).trim().toUpperCase().replace(/\s+/g, "").replace(/[-_.]/g, "");
}

function normalizeText(s) {
    return String(s || "").trim().toLowerCase();
}

function getCohortYearFromStudentId(studentId) {
    if (!studentId || String(studentId).length < 2) return null;
    const yy = parseInt(String(studentId).slice(0, 2), 10);
    if (Number.isNaN(yy)) return null;
    return 2000 + yy; // 20xx
}

function getStudyYear(cohortYear) {
    if (!cohortYear) return null;
    // 2021 → 2025 - 2021 + 1 = 5
    const y = CURRENT_ACADEMIC_YEAR - cohortYear + 1;
    return Math.max(1, Math.min(y, 5)); // clamp 1..5
}

function parseSemesterNumber(semesterStr) {
    if (!semesterStr) return null;
    const m = String(semesterStr).match(/(\d+)/);
    if (!m) return null;
    return parseInt(m[1], 10);
}

function getFacultyIdForMajor(majorCode) {
    return MAJOR_CODE_TO_FACULTY_ID[majorCode] || null;
}

function getTotalCredits(subject) {
    const t = Number(subject.theory_credits) || 0;
    const p = Number(subject.practice_credits) || 0;
    return t + p;
}

function isElectiveType(subjectType) {
    if (!subjectType) return false;
    const t = String(subjectType).toUpperCase();
    // giữ như bản trước bạn dùng
    return t === "CNTC" || t === "CĐTN" || t === "CDTN" || t === "CN";
}

function randomDateInRange(start, end) {
    const s = start.getTime();
    const e = end.getTime();
    const r = s + Math.random() * (e - s);
    return new Date(r);
}

// =========================
// LOAD CHƯƠNG TRÌNH ĐÀO TẠO
// =========================

function loadCurriculum() {
    const files = [
        "Khoa_MMTvaTT_K19_2025.json",
        "Khoa_KHvaKTTT_K19_2025.json",
        "Khoa_KHMT_K19_2025.json",
        "Khoa_CNPM_K19_2025.json",
        "Khoa_KTMT_K19_2025.json",
        "Khoa_HTTT_K19_2025.json",
    ];

    const tmp = {}; // { majorCode: { semesterNumber: Set(subject_id) } }

    for (const file of files) {
        const fullPath = path.join(DATA_DIR, file);
        if (!fs.existsSync(fullPath)) {
            console.warn(`[WARN] Không tìm thấy file CTĐT: ${fullPath}`);
            continue;
        }

        const raw = fs.readFileSync(fullPath, "utf8");
        const arr = JSON.parse(raw); // { major, faculty, semester, subjects }

        for (const row of arr) {
            const majorName = row.major;
            const majorCode = MAJOR_NAME_TO_CODE[majorName];
            if (!majorCode) {
                console.warn(`[WARN] Không map được majorName -> majorCode: "${majorName}"`);
                continue;
            }

            const semNum = parseSemesterNumber(row.semester);
            if (!semNum) continue;

            if (!tmp[majorCode]) tmp[majorCode] = {};
            if (!tmp[majorCode][semNum]) tmp[majorCode][semNum] = new Set();

            const subjects = Array.isArray(row.subjects) ? row.subjects : [];
            for (const sid of subjects) {
                if (!sid) continue;
                tmp[majorCode][semNum].add(String(sid).trim());
            }
        }
    }

    const curriculum = {};
    for (const [majorCode, bySem] of Object.entries(tmp)) {
        curriculum[majorCode] = {};
        for (const [semStr, set] of Object.entries(bySem)) {
            curriculum[majorCode][Number(semStr)] = Array.from(set);
        }
    }

    console.log("[INFO] Đã load CTĐT cho majors:", Object.keys(curriculum));
    for (const [m, sems] of Object.entries(curriculum)) {
        const semKeys = Object.keys(sems)
            .map((x) => Number(x))
            .sort((a, b) => a - b);
        const totalSub = semKeys.reduce((acc, k) => acc + (sems[k]?.length || 0), 0);

        console.log(`  - ${m}: HK = ${semKeys.join(", ")} | tổng môn trong CTĐT = ${totalSub}`);
    }

    return curriculum;
}

// =========================
// CHỌN MÔN TỰ CHỌN NGẪU NHIÊN
// =========================

function pickRandomElectives({
    electivePool,
    excludeIds,
    maxToPick,
    maxExtraCredits,
    studentFaculty,
    crossMajorOnly,
}) {
    if (maxExtraCredits <= 0) return [];

    const candidates = electivePool.filter((subj) => {
        const id = (subj.subject_id || "").trim();
        if (!id || excludeIds.has(id)) return false;

        if (crossMajorOnly) {
            const fac = subj.faculty_id || null;
            if (studentFaculty && fac && fac === studentFaculty) return false;
        }

        const credits = getTotalCredits(subj);
        if (credits <= 0 || credits > maxExtraCredits) return false;
        return true;
    });

    // Shuffle Fisher–Yates
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const selected = [];
    let usedCredits = 0;

    for (const subj of candidates) {
        if (selected.length >= maxToPick) break;
        const c = getTotalCredits(subj);
        if (usedCredits + c > maxExtraCredits) continue;
        selected.push(subj);
        usedCredits += c;
    }

    return selected;
}

// =========================
// Year-5: chọn TTDN + KLTN theo khoa
// =========================

function pickYear5InternshipSubject({ subjects, studentFaculty }) {
    if (!studentFaculty) return null;

    // ưu tiên: subject_name chứa "Thực tập doanh nghiệp", status=open, đúng khoa
    const matchesByName = subjects.filter((s) => {
        if ((s.faculty_id || "").trim() !== studentFaculty) return false;
        const name = normalizeText(s.subject_name);
        if (!name.includes("thực tập doanh nghiệp")) return false;
        return true;
    });

    const openByName = matchesByName.filter((s) => s.status === "open");
    const pool1 = openByName.length ? openByName : matchesByName;

    if (pool1.length) {
        // chọn môn có tín chỉ cao nhất (LT+TH), nếu hoà thì ưu tiên subject_id lớn hơn (ổn định)
        pool1.sort((a, b) => {
            const ca = getTotalCredits(a);
            const cb = getTotalCredits(b);
            if (cb !== ca) return cb - ca;
            return String(b.subject_id || "").localeCompare(String(a.subject_id || ""));
        });
        return pool1[0];
    }

    // fallback: theo subject_type (TTTN hoặc TN)
    const typePool = subjects.filter((s) => {
        if ((s.faculty_id || "").trim() !== studentFaculty) return false;
        const t = String(s.subject_type || "").toUpperCase();
        return t === "TTTN" || t === "TN";
    });

    const openType = typePool.filter((s) => s.status === "open");
    const pool2 = openType.length ? openType : typePool;

    if (!pool2.length) return null;

    pool2.sort((a, b) => getTotalCredits(b) - getTotalCredits(a));
    return pool2[0];
}

function pickYear5ThesisSubject({ subjects, studentFaculty }) {
    if (!studentFaculty) return null;

    const pool = subjects.filter((s) => {
        if ((s.faculty_id || "").trim() !== studentFaculty) return false;
        const t = String(s.subject_type || "").toUpperCase();
        return t === "KLTN";
    });

    const openPool = pool.filter((s) => s.status === "open");
    const finalPool = openPool.length ? openPool : pool;

    if (!finalPool.length) return null;

    finalPool.sort((a, b) => getTotalCredits(b) - getTotalCredits(a));
    return finalPool[0];
}

// =========================
// TẠO PHIẾU ĐĂNG KÝ CHO 1 SINH VIÊN
// =========================

function buildRegistrationForStudent({
    student,
    subjectMap, // Map normalizedSubjectId -> subjectDoc
    curriculum,
    electivePool,
    subjectsAll, // array
    missingCounter,
}) {
    const studentId = student.student_id;
    if (!studentId) return null;

    const cohortYear = getCohortYearFromStudentId(studentId);
    const studyYear = getStudyYear(cohortYear);
    if (!studyYear) {
        console.warn(`[WARN] Không xác định được studyYear cho MSSV ${studentId}`);
        return null;
    }

    // Học kỳ 2 của năm học hiện tại → semesterNumber = studyYear * 2
    let semesterNumber = studyYear * 2;
    if (semesterNumber > 8) semesterNumber = 8;

    const majorList = Array.isArray(student.major_id)
        ? student.major_id
        : student.major_id
            ? [student.major_id]
            : [];
    const majorCode = String(majorList[0] || "").toUpperCase();
    const studentFaculty = getFacultyIdForMajor(majorCode);

    const items = [];
    const addedIds = new Set();

    let totalCredits = 0;
    let totalTheoryCredits = 0;
    let totalPracticeCredits = 0;

    function addSubjectDoc(subj, isFromCurriculum) {
        if (!subj) return;
        const sidRaw = (subj.subject_id || "").trim();
        if (!sidRaw) return;
        if (addedIds.has(sidRaw)) return;

        const theory_credits = Number(subj.theory_credits) || 0;
        const practice_credits = Number(subj.practice_credits) || 0;
        const credits = theory_credits + practice_credits;
        if (credits <= 0) return;

        const subject_type = (subj.subject_type || "").toUpperCase();
        const is_elective = isElectiveType(subject_type);
        const fac = (subj.faculty_id || "").trim() || null;

        const is_cross_major_elective =
            !isFromCurriculum && is_elective && studentFaculty && fac && fac !== studentFaculty;

        items.push({
            subject_id: subj.subject_id,
            subject_name: subj.subject_name,
            subject_type,
            faculty_id: fac,
            theory_credits,
            practice_credits,
            total_credits: credits,
            is_elective,
            is_cross_major_elective,
            from_curriculum: !!isFromCurriculum,
        });

        addedIds.add(sidRaw);
        totalCredits += credits;
        totalTheoryCredits += theory_credits;
        totalPracticeCredits += practice_credits;
    }

    // ====== YEAR 5 override: chỉ đăng ký TTDN + KLTN theo khoa ======
    if (studyYear === 5) {
        const internship = pickYear5InternshipSubject({
            subjects: subjectsAll,
            studentFaculty,
        });
        if (!internship) {
            console.warn(
                `[WARN] Year-5 internship không tìm thấy cho faculty ${studentFaculty}. (Cần có môn "Thực tập doanh nghiệp" hoặc subject_type TTTN/TN)`
            );
        } else {
            addSubjectDoc(internship, false);
        }

        const thesis = pickYear5ThesisSubject({
            subjects: subjectsAll,
            studentFaculty,
        });
        if (!thesis) {
            console.warn(`[WARN] Year-5 thesis (KLTN) không tìm thấy cho faculty ${studentFaculty}.`);
        } else {
            addSubjectDoc(thesis, false);
        }
    } else {
        // ====== YEAR 1-4: theo CTĐT ======
        const planBySem = curriculum[majorCode] || null;

        let baseSubjectIds = [];
        if (planBySem) {
            let semKey = semesterNumber;
            if (!planBySem[semKey]) {
                const available = Object.keys(planBySem)
                    .map((x) => Number(x))
                    .sort((a, b) => a - b);
                semKey = available[available.length - 1];
            }
            baseSubjectIds = planBySem[semKey] || [];
        } else {
            console.warn(`[WARN] Không có CTĐT cho ngành ${majorCode}, MSSV ${studentId}`);
        }

        // 1) add các môn trong CTĐT
        for (const sid of baseSubjectIds) {
            const key = normalizeSubjectId(sid);
            const subj = subjectMap.get(key);
            if (!subj) {
                missingCounter.count++;
                console.warn(
                    `[WARN] subject_id "${sid}" (major ${majorCode}) không tìm thấy trong collection ${SUBJECTS_COLLECTION}`
                );
                continue;
            }
            addSubjectDoc(subj, true);
        }

        // 2) nếu < MIN_CREDITS -> add tự chọn
        if (totalCredits < MIN_CREDITS && electivePool.length > 0) {
            const need = MIN_CREDITS - totalCredits;
            const extra = pickRandomElectives({
                electivePool,
                excludeIds: addedIds,
                maxToPick: 5,
                maxExtraCredits: Math.min(need + 6, MAX_CREDITS - totalCredits),
                studentFaculty,
                crossMajorOnly: false,
            });

            for (const subj of extra) {
                if (totalCredits >= MAX_CREDITS) break;
                addSubjectDoc(subj, false);
            }
        }

        // 3) khoá 21–23: 20% add cross-major elective 1-2 môn
        const isOlderCohort = cohortYear && cohortYear <= 2023;
        if (isOlderCohort && Math.random() < 0.2 && totalCredits < MAX_CREDITS) {
            const remainingCredits = MAX_CREDITS - totalCredits;
            if (remainingCredits > 0 && electivePool.length > 0) {
                const maxToPick = Math.random() < 0.5 ? 1 : 2;
                const crossExtras = pickRandomElectives({
                    electivePool,
                    excludeIds: addedIds,
                    maxToPick,
                    maxExtraCredits: remainingCredits,
                    studentFaculty,
                    crossMajorOnly: true,
                });

                for (const subj of crossExtras) {
                    if (totalCredits >= MAX_CREDITS) break;
                    addSubjectDoc(subj, false);
                }
            }
        }

        // 4) fallback đẩy lên >= MIN
        if (totalCredits < MIN_CREDITS && electivePool.length > 0) {
            const remaining = MIN_CREDITS - totalCredits;
            const fallback = pickRandomElectives({
                electivePool,
                excludeIds: addedIds,
                maxToPick: 5,
                maxExtraCredits: Math.min(remaining + 6, MAX_CREDITS - totalCredits),
                studentFaculty: null,
                crossMajorOnly: false,
            });

            for (const subj of fallback) {
                if (totalCredits >= MIN_CREDITS || totalCredits >= MAX_CREDITS) break;
                addSubjectDoc(subj, false);
            }
        }
    }

    if (items.length === 0) return null;

    // ==== Thông tin BM5/BM6 ====
    const registration_no = `PDK-${CURRENT_ACADEMIC_YEAR}${CURRENT_SEMESTER}-${studentId}`;
    const semester_label = `HK${CURRENT_SEMESTER}`;

    let registration_round = 1;
    if (studyYear >= 3) registration_round = Math.random() < 0.3 ? 2 : 1;
    else registration_round = Math.random() < 0.1 ? 2 : 1;

    const registered_at = randomDateInRange(REG_WINDOW_START, REG_WINDOW_END);

    const tuitionTheory = totalTheoryCredits * TUITION_THEORY_PER_CREDIT;
    const tuitionPractice = totalPracticeCredits * TUITION_PRACTICE_PER_CREDIT;
    const tuitionTotal = tuitionTheory + tuitionPractice;

    return {
        // dùng làm key upsert + tránh duplicate index (nếu unique)
        bms_number: registration_no,

        registration_no,
        student_id: student.student_id,
        student_mongo_id: student._id,
        name: student.name,
        major_id: majorCode,
        cohort_year: cohortYear,
        study_year: studyYear,
        semester: CURRENT_SEMESTER,
        semester_label,
        academic_year: ACADEMIC_YEAR_LABEL,

        total_credits: totalCredits,

        tuition: {
            total_theory_credits: totalTheoryCredits,
            total_practice_credits: totalPracticeCredits,
            total_credits: totalCredits,
            fee_per_credit_theory: TUITION_THEORY_PER_CREDIT,
            fee_per_credit_practice: TUITION_PRACTICE_PER_CREDIT,
            amount_theory: tuitionTheory,
            amount_practice: tuitionPractice,
            amount_total: tuitionTotal,
        },

        registration_round,
        registration_window: {
            start: REG_WINDOW_START,
            end: REG_WINDOW_END,
        },
        registered_at,

        items,
        meta: {
            source: "synthetic-registration-script",
            faculty_of_student: studentFaculty,
            has_cross_major_elective: items.some((i) => i.is_cross_major_elective),
        },
    };
}

// =========================
// BULK UPSERT HELPERS
// =========================

async function flushUpsertBatch(regColl, batch) {
    if (!batch.length) return;

    const ops = batch.map((reg) => ({
        updateOne: {
            filter: { bms_number: reg.bms_number },
            update: { $set: reg },
            upsert: true,
        },
    }));

    await regColl.bulkWrite(ops, { ordered: false });
}

// =========================
// MAIN
// =========================

async function main() {
    if (!MONGO_URI) {
        console.error("Thiếu MONGO_URI trong .env");
        process.exit(1);
    }

    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log("[INFO] Đã kết nối MongoDB");

    const db = client.db(DB_NAME);

    const studentsColl = db.collection(STUDENTS_COLLECTION);
    const subjectsColl = db.collection(SUBJECTS_COLLECTION);
    const regColl = db.collection(REG_COLLECTION);

    // 1) Load subjects
    const subjects = await subjectsColl.find({}).toArray();
    console.log(`[INFO] Loaded ${subjects.length} subjects from collection "${SUBJECTS_COLLECTION}"`);

    if (subjects.length === 0) {
        console.error(`[ERROR] Collection "${SUBJECTS_COLLECTION}" đang rỗng hoặc sai tên.`);
        await client.close();
        process.exit(1);
    }

    // subjectMap: normalized subject_id -> subject
    // + map luôn old_id/equivalent_id để giảm missing
    const subjectMap = new Map();
    const electivePool = [];

    function putAlias(aliasId, subj) {
        const key = normalizeSubjectId(aliasId);
        if (!key) return;

        const prev = subjectMap.get(key);
        if (!prev) {
            subjectMap.set(key, subj);
            return;
        }

        // ưu tiên status=open
        if (prev.status !== "open" && subj.status === "open") {
            subjectMap.set(key, subj);
            return;
        }
    }

    for (const s of subjects) {
        const sid = (s.subject_id || "").trim();
        if (sid) putAlias(sid, s);

        const oldIds = Array.isArray(s.old_id) ? s.old_id : [];
        const eqIds = Array.isArray(s.equivalent_id) ? s.equivalent_id : [];
        for (const x of [...oldIds, ...eqIds]) putAlias(x, s);

        if (isElectiveType(s.subject_type)) electivePool.push(s);
    }

    console.log(`[INFO] subjectMap size (incl aliases old/equivalent) = ${subjectMap.size}`);
    console.log(`[INFO] Trong đó có ${electivePool.length} môn tự chọn (CNTC/CĐTN/CN)`);

    // 2) Load CTĐT
    const curriculum = loadCurriculum();

    // 3) Duyệt toàn bộ sinh viên bằng cursor (không load hết lên RAM)
    const query = {}; // nếu muốn lọc thì sửa ở đây
    const cursor = studentsColl.find(query, { batchSize: CURSOR_BATCH_SIZE });

    let processed = 0;
    let created = 0;
    let registrationsBatch = [];

    // 4) KHÔNG deleteMany nữa.
    //    Upsert theo bms_number => chạy lặp không nhân bản + an toàn hơn.
    //    (Nếu muốn “reset” riêng một kỳ thì bạn có thể tự bật lại deleteMany.)

    // 5) Lặp cursor và UPSERT theo batch
    for await (const stu of cursor) {
        processed++;

        const reg = buildRegistrationForStudent({
            student: stu,
            subjectMap,
            curriculum,
            electivePool,
            subjectsAll: subjects,
            missingCounter,
        });

        if (reg && reg.items.length > 0) {
            registrationsBatch.push(reg);
            created++;
        }

        // flush batch upsert
        if (registrationsBatch.length >= UPSERT_BATCH_SIZE) {
            await flushUpsertBatch(regColl, registrationsBatch);
            registrationsBatch = [];
            console.log(
                `[INFO] processed=${processed} created=${created} (upsert batch ${UPSERT_BATCH_SIZE})`
            );
        }

        // nếu bạn vẫn muốn giới hạn thì bật lại:
        if (MAX_STUDENTS && processed >= MAX_STUDENTS) break;
    }

    // upsert phần còn lại
    if (registrationsBatch.length > 0) {
        await flushUpsertBatch(regColl, registrationsBatch);
        console.log(`[INFO] upsert last batch size=${registrationsBatch.length}`);
    }

    console.log(`[INFO] Processed students = ${processed}`);
    console.log(`[INFO] Created/Upserted registrations = ${created}`);
    console.log(`[INFO] Tổng WARN missing subject = ${missingCounter.count}`);

    await client.close();
    console.log("[INFO] Done.");
}

main().catch((err) => {
    console.error("[FATAL]", err);
    process.exit(1);
});
