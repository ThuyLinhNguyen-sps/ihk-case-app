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

function label(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function row(labelLeft: string, valueRight: any) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            children: [new TextRun({ text: labelLeft, bold: true })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 65, type: WidthType.PERCENTAGE },
        children: [new Paragraph(label(valueRight))],
      }),
    ],
  });
}

function jsonToBullet(value: any) {
  if (!value) return [new Paragraph("—")];
  if (Array.isArray(value) && value.length === 0) return [new Paragraph("—")];

  // nếu là mảng object: mỗi item 1 bullet
  if (Array.isArray(value)) {
    return value.map((item, idx) => {
      const text =
        typeof item === "string"
          ? item
          : typeof item === "object"
            ? Object.entries(item)
                .map(([k, v]) => `${k}: ${v ?? ""}`)
                .join(" | ")
            : String(item);

      return new Paragraph({
        text: `${idx + 1}. ${text}`,
      });
    });
  }

  // object
  if (typeof value === "object") {
    const text = Object.entries(value)
      .map(([k, v]) => `${k}: ${v ?? ""}`)
      .join(" | ");
    return [new Paragraph(text || "—")];
  }

  return [new Paragraph(String(value))];
}

export async function buildSoYeuLyLichDocx(caseData: any, profile: any) {
  const fullName = caseData?.fullName ?? "";
  const dob = caseData?.dob ? new Date(caseData.dob).toLocaleDateString("vi-VN") : "";

  const marital =
    profile?.maritalStatus === "KET_HON"
      ? "Đã kết hôn"
      : profile?.maritalStatus === "LY_HON"
        ? "Ly hôn"
        : "Độc thân";

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "SƠ YẾU LÝ LỊCH",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),

          new Paragraph({ text: "" }),

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
              row("Tình trạng hôn nhân", marital),
              row(
                "Ngày kết hôn (nếu có)",
                profile?.marriageDate ? new Date(profile.marriageDate).toLocaleDateString("vi-VN") : ""
              ),
              row(
                "Ngày ly hôn (nếu có)",
                profile?.divorceDate ? new Date(profile.divorceDate).toLocaleDateString("vi-VN") : ""
              ),
            ],
          }),

          new Paragraph({ text: "" }),

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

          new Paragraph({ text: "" }),

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

          new Paragraph({ text: "" }),

          new Paragraph({
            text: "IV. TÀI SẢN",
            heading: HeadingLevel.HEADING_2,
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [row("Tài sản lớn", profile?.bigAssets)],
          }),

          new Paragraph({ text: "" }),

          new Paragraph({
            text: "V. THÔNG TIN GIA ĐÌNH",
            heading: HeadingLevel.HEADING_2,
          }),
          ...jsonToBullet(profile?.familyMembers),

          new Paragraph({ text: "" }),

          new Paragraph({
            text: "VI. QUÁ TRÌNH HỌC TẬP",
            heading: HeadingLevel.HEADING_2,
          }),
          ...jsonToBullet(profile?.educationHistory),

          new Paragraph({ text: "" }),

          new Paragraph({
            text: "VII. QUÁ TRÌNH CÔNG TÁC",
            heading: HeadingLevel.HEADING_2,
          }),
          ...jsonToBullet(profile?.workHistory),

          new Paragraph({ text: "" }),

          new Paragraph({
            text: "VIII. LỊCH SỬ XUẤT/NHẬP CẢNH",
            heading: HeadingLevel.HEADING_2,
          }),
          ...jsonToBullet(profile?.travelHistory),

          new Paragraph({ text: "" }),

          new Paragraph({
            text:
              "Tôi xin cam đoan những thông tin trên là đúng sự thật. Nếu sai tôi xin hoàn toàn chịu trách nhiệm.",
          }),

          new Paragraph({ text: "" }),

          new Paragraph({
            children: [
              new TextRun("Ngày ....... tháng ....... năm ......."),
            ],
            alignment: AlignmentType.RIGHT,
          }),

          new Paragraph({ text: "" }),

          new Paragraph({
            children: [new TextRun({ text: "Người khai (Ký, ghi rõ họ tên)", bold: true })],
            alignment: AlignmentType.RIGHT,
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
