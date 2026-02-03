import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

/** =========================
 * Helpers
 * ========================= */

const VN_FONT = "Times New Roman";

function safe(v: any) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function label(v: any) {
  const s = safe(v);
  return s.length ? s : "—";
}

function vnDate(v: any) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

function row(labelLeft: string, valueRight: any) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: labelLeft, bold: true, font: VN_FONT }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 65, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            children: [new TextRun({ text: label(valueRight), font: VN_FONT })],
          }),
        ],
      }),
    ],
  });
}

/** =========================
 * Enum labels (VN)
 * ========================= */
function vnMaritalStatus(v: any) {
  if (v === "KET_HON") return "Đã kết hôn";
  if (v === "LY_HON") return "Ly hôn";
  return "Độc thân";
}

function vnRelation(v: any) {
  const map: Record<string, string> = {
    BO: "Bố",
    ME: "Mẹ",
    VO_CHONG: "Vợ/Chồng",
    CON: "Con",
    ANH_CHI_EM: "Anh/Chị/Em",
    KHAC: "Khác",
  };
  return map[v] ?? label(v);
}

function vnEduLevel(v: any) {
  const map: Record<string, string> = {
    TIEU_HOC: "Tiểu học",
    TRUNG_HOC: "Trung học",
    THPT: "THPT",
    TRUNG_CAP: "Trung cấp",
    CAO_DANG: "Cao đẳng",
    DAI_HOC: "Đại học",
    KHAC: "Khác",
  };
  return map[v] ?? label(v);
}

function vnTravelPurpose(v: any) {
  const map: Record<string, string> = {
    DU_LICH: "Du lịch",
    XKLĐ: "Xuất khẩu lao động",
    HOC_TAP: "Học tập",
    CONG_TAC: "Công tác",
    KHAC: "Khác",
  };
  return map[v] ?? label(v);
}

function bullet(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, font: VN_FONT })],
    bullet: { level: 0 },
  });
}

function emptyLine() {
  return new Paragraph({ children: [new TextRun({ text: "", font: VN_FONT })] });
}

/** =========================
 * Section formatters (VN)
 * ========================= */

function renderFamilyMembers(value: any): Paragraph[] {
  if (!Array.isArray(value) || value.length === 0) return [new Paragraph({ children: [new TextRun({ text: "—", font: VN_FONT })] })];

  return value.map((m: any, idx: number) => {
    const text =
      `${idx + 1}) ${vnRelation(m?.relation)}: ` +
      `${label(m?.fullName)}; ` +
      `Ngày sinh: ${m?.dob ? vnDate(m.dob) : "—"}; ` +
      `Quê quán: ${label(m?.hometown)}`;
    return new Paragraph({ children: [new TextRun({ text, font: VN_FONT })] });
  });
}

function renderFamilyJobsIncome(value: any): Paragraph[] {
  if (!Array.isArray(value) || value.length === 0) return [new Paragraph({ children: [new TextRun({ text: "—", font: VN_FONT })] })];

  return value.map((x: any, idx: number) => {
    const text =
      `${idx + 1}) ${vnRelation(x?.relation)} — ` +
      `Công việc: ${label(x?.job)}; ` +
      `Thu nhập: ${label(x?.income)}; ` +
      `Chi tiết: ${label(x?.details)}`;
    return new Paragraph({ children: [new TextRun({ text, font: VN_FONT })] });
  });
}

function renderEducationHistory(value: any): Paragraph[] {
  if (!Array.isArray(value) || value.length === 0) return [new Paragraph({ children: [new TextRun({ text: "—", font: VN_FONT })] })];

  return value.map((ed: any, idx: number) => {
    const text =
      `${idx + 1}) ${vnEduLevel(ed?.level)} — ` +
      `Thời gian: ${label(ed?.fromYear)} – ${label(ed?.toYear)}; ` +
      `Trường: ${label(ed?.schoolName)}; ` +
      `Địa chỉ: ${label(ed?.address)}; ` +
      `Chuyên ngành: ${label(ed?.major)}; ` +
      `Ghi chú: ${label(ed?.notes)}`;
    return new Paragraph({ children: [new TextRun({ text, font: VN_FONT })] });
  });
}

function renderWorkHistory(value: any): Paragraph[] {
  if (!Array.isArray(value) || value.length === 0) return [new Paragraph({ children: [new TextRun({ text: "—", font: VN_FONT })] })];

  return value.map((w: any, idx: number) => {
    const text =
      `${idx + 1}) Thời gian: ${label(w?.fromYear)} – ${label(w?.toYear)}; ` +
      `Công ty: ${label(w?.company)}; ` +
      `Địa chỉ: ${label(w?.address)}; ` +
      `Chức vụ: ${label(w?.position)}; ` +
      `Ghi chú: ${label(w?.notes)}`;
    return new Paragraph({ children: [new TextRun({ text, font: VN_FONT })] });
  });
}

function renderTravelHistory(value: any): Paragraph[] {
  if (!Array.isArray(value) || value.length === 0) return [new Paragraph({ children: [new TextRun({ text: "—", font: VN_FONT })] })];

  return value.map((t: any, idx: number) => {
    const illegal = t?.illegalStay ? "Có" : "Không";
    const text =
      `${idx + 1}) Quốc gia: ${label(t?.country)}; ` +
      `Thời gian: ${t?.fromDate ? vnDate(t.fromDate) : "—"} – ${t?.toDate ? vnDate(t.toDate) : "—"}; ` +
      `Diện: ${vnTravelPurpose(t?.purpose)}; ` +
      `Bất hợp pháp/quá hạn: ${illegal}; ` +
      `Ghi chú: ${label(t?.notes)}`;
    return new Paragraph({ children: [new TextRun({ text, font: VN_FONT })] });
  });
}

/** =========================
 * Builder
 * ========================= */
export async function buildSoYeuLyLichDocx(caseData: any, profile: any) {
  const fullName = caseData?.fullName ?? "";
  const dob = caseData?.dob ? new Date(caseData.dob).toLocaleDateString("vi-VN") : "—";

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: VN_FONT },
          paragraph: { spacing: { line: 276 } }, // line-height nhẹ
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "SƠ YẾU LÝ LỊCH",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),

          emptyLine(),

          new Paragraph({
            text: "I. THÔNG TIN CÁ NHÂN",
            heading: HeadingLevel.HEADING_2,
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              row("Họ và tên", fullName),
              row("Ngày sinh", dob),
              row("Số điện thoại", profile?.phone),
              row("Email", profile?.email),
              row("Địa chỉ nhà", profile?.homeAddress),
              row("Chiều cao (cm)", profile?.heightCm),
              row("Màu mắt", profile?.eyeColor),
              row("Tôn giáo", profile?.religion),
              row("Tình trạng hôn nhân", vnMaritalStatus(profile?.maritalStatus)),
              row("Ngày kết hôn (nếu có)", profile?.marriageDate ? vnDate(profile.marriageDate) : "—"),
              row("Ngày ly hôn (nếu có)", profile?.divorceDate ? vnDate(profile.divorceDate) : "—"),
            ],
          }),

          emptyLine(),

          new Paragraph({
            text: "II. CÔNG VIỆC HIỆN TẠI",
            heading: HeadingLevel.HEADING_2,
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              row("Công ty đang làm việc", profile?.currentCompany),
              row("Địa chỉ công ty", profile?.companyAddress),
            ],
          }),

          emptyLine(),

          new Paragraph({
            text: "III. HỌC VẤN",
            heading: HeadingLevel.HEADING_2,
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              row("Trường tốt nghiệp", profile?.graduatedSchool),
              row("Chuyên ngành", profile?.major),
            ],
          }),

          emptyLine(),

          new Paragraph({
            text: "IV. TÀI SẢN",
            heading: HeadingLevel.HEADING_2,
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [row("Tài sản lớn", profile?.bigAssets)],
          }),

          emptyLine(),

          new Paragraph({
            text: "V. THÔNG TIN GIA ĐÌNH",
            heading: HeadingLevel.HEADING_2,
          }),
          ...renderFamilyMembers(profile?.familyMembers),

          emptyLine(),

          new Paragraph({
            text: "VI. CÔNG VIỆC & THU NHẬP CỦA GIA ĐÌNH",
            heading: HeadingLevel.HEADING_2,
          }),
          ...renderFamilyJobsIncome(profile?.familyJobsIncome),

          emptyLine(),

          new Paragraph({
            text: "VII. QUÁ TRÌNH HỌC TẬP",
            heading: HeadingLevel.HEADING_2,
          }),
          ...renderEducationHistory(profile?.educationHistory),

          emptyLine(),

          new Paragraph({
            text: "VIII. QUÁ TRÌNH CÔNG TÁC",
            heading: HeadingLevel.HEADING_2,
          }),
          ...renderWorkHistory(profile?.workHistory),

          emptyLine(),

          new Paragraph({
            text: "IX. LỊCH SỬ XUẤT/NHẬP CẢNH",
            heading: HeadingLevel.HEADING_2,
          }),
          ...renderTravelHistory(profile?.travelHistory),

          emptyLine(),

          new Paragraph({
            children: [
              new TextRun({
                text:
                  "Tôi xin cam đoan những thông tin trên là đúng sự thật. Nếu sai tôi xin hoàn toàn chịu trách nhiệm.",
                font: VN_FONT,
              }),
            ],
          }),

          emptyLine(),

          new Paragraph({
            children: [new TextRun({ text: "Ngày ....... tháng ....... năm .......", font: VN_FONT })],
            alignment: AlignmentType.RIGHT,
          }),

          emptyLine(),

          new Paragraph({
            children: [new TextRun({ text: "Người khai (Ký, ghi rõ họ tên)", bold: true, font: VN_FONT })],
            alignment: AlignmentType.RIGHT,
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
