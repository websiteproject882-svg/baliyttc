import PDFDocument from "pdfkit";

interface CertificateData {
  studentName: string;
  courseName: string;
  courseHours: number;
  completionDate: Date;
  certificateId: string;
  schoolName: string;
  schoolLocation: string;
  instructorName?: string;
  templateImageUrl?: string;
}

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  let templateImageBuffer: Buffer | null = null;
  if (data.templateImageUrl) {
    try {
      const response = await fetch(data.templateImageUrl);
      const contentType = response.headers.get("content-type") || "";
      if (response.ok && contentType.startsWith("image/")) {
        templateImageBuffer = Buffer.from(await response.arrayBuffer());
      }
    } catch {
      // Keep generated certificate available if the optional template image is unreachable.
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 50,
      });

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      if (templateImageBuffer) {
        try {
          doc.image(templateImageBuffer, 0, 0, { width: pageWidth, height: pageHeight });
        } catch {
          // Keep fallback certificate design if the configured image is unsupported.
        }
      }

      // Border decoration
      doc.strokeColor("#F04E23", 0.8);
      doc.lineWidth(3);
      doc.rect(30, 30, pageWidth - 60, pageHeight - 60).stroke();

      doc.strokeColor("#E03E11", 0.5);
      doc.lineWidth(1);
      doc.rect(40, 40, pageWidth - 80, pageHeight - 80).stroke();

      // Header ornament
      doc.strokeColor("#F04E23", 0.3);
      doc.lineWidth(0.5);
      doc.moveTo(100, 80).lineTo(pageWidth - 100, 80).stroke();

      // School name
      doc.fillColor("#333333")
        .font("Helvetica-Bold")
        .fontSize(28)
        .text(data.schoolName, 0, 100, { align: "center" });

      doc.fillColor("#666666")
        .font("Helvetica")
        .fontSize(12)
        .text(data.schoolLocation, 0, 135, { align: "center" });

      // Certificate title
      doc.fillColor("#F04E23")
        .font("Helvetica-Bold")
        .fontSize(36)
        .text("CERTIFICATE", 0, 180, { align: "center" });

      doc.fillColor("#333333")
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("OF COMPLETION", 0, 220, { align: "center" });

      // Decorative line
      doc.strokeColor("#F04E23")
        .lineWidth(2)
        .moveTo(pageWidth / 2 - 100, 250)
        .lineTo(pageWidth / 2 + 100, 250)
        .stroke();

      // "This is to certify that"
      doc.fillColor("#555555")
        .font("Helvetica")
        .fontSize(14)
        .text("This is to certify that", 0, 280, { align: "center" });

      // Student name
      doc.fillColor("#333333")
        .font("Helvetica-Bold")
        .fontSize(32)
        .text(data.studentName, 0, 310, { align: "center" });

      // Decorative line under name
      doc.strokeColor("#F04E23")
        .lineWidth(1)
        .moveTo(pageWidth / 2 - 150, 345)
        .lineTo(pageWidth / 2 + 150, 345)
        .stroke();

      // "has successfully completed"
      doc.fillColor("#555555")
        .font("Helvetica")
        .fontSize(14)
        .text("has successfully completed", 0, 365, { align: "center" });

      // Course name
      doc.fillColor("#333333")
        .font("Helvetica-Bold")
        .fontSize(24)
        .text(data.courseName, 0, 395, { align: "center" });

      // Course hours
      doc.fillColor("#666666")
        .font("Helvetica")
        .fontSize(14)
        .text(`(${data.courseHours} Hours)`, 0, 425, { align: "center" });

      // Completion date
      doc.fillColor("#555555")
        .font("Helvetica")
        .fontSize(12)
        .text(`Issued on ${data.completionDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, 0, 465, { align: "center" });

      // Footer - Certificate ID
      doc.fillColor("#999999")
        .font("Helvetica")
        .fontSize(10)
        .text(`Certificate ID: ${data.certificateId}`, 50, pageHeight - 100, { align: "left" });

      // Yoga Alliance certification
      doc.fillColor("#F04E23")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Yoga Alliance RYS 200 & RYS 300 Certified School", pageWidth - 350, pageHeight - 100, { align: "left" });

      // Instructor signature area
      if (data.instructorName) {
        doc.strokeColor("#CCCCCC")
          .lineWidth(0.5)
          .moveTo(100, pageHeight - 150)
          .lineTo(250, pageHeight - 150)
          .stroke();

        doc.fillColor("#666666")
          .font("Helvetica")
          .fontSize(10)
          .text(data.instructorName, 100, pageHeight - 140, { align: "center", width: 150 });
        doc.text("Lead Instructor", 100, pageHeight - 128, { align: "center", width: 150 });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export function generateCertificateId(courseSlug: string, year: number): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BALI-${courseSlug.toUpperCase()}-${year}-${random}`;
}
