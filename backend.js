const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/send-pdf", async (req, res) => {
  const { correoDestino, empleado, cargo, sueldo, horasExtras, total } = req.body;

  const pdfPath = `recibo_${Date.now()}.pdf`;
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  doc.fontSize(18).text("📄 ROL DE PAGOS", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Empleado: ${empleado}`);
  doc.text(`Cargo: ${cargo}`);
  doc.text(`Sueldo base: $${sueldo}`);
  doc.text(`Horas extras: ${horasExtras}`);
  doc.text(`Total a pagar: $${total}`);
  doc.moveDown();
  doc.text("Gracias por usar PAYROLL", { align: "center" });

  doc.end();

  stream.on("finish", async () => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    try {
      await transporter.sendMail({
        from: `"PAYROLL" <${process.env.EMAIL_USER}>`,
        to: correoDestino,
        subject: "📎 Recibo de Rol de Pagos",
        text: "Adjunto encontrarás el recibo del rol de pagos.",
        attachments: [
          {
            filename: "RolDePagos.pdf",
            path: `./${pdfPath}`
          }
        ]
      });

      fs.unlinkSync(pdfPath);

      res.status(200).send({ success: true, message: "📧 Correo enviado con PDF adjunto." });
    } catch (error) {
      console.error(error);
      res.status(500).send({ success: false, message: "❌ Error al enviar el PDF." });
    }
  });
});

app.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});
