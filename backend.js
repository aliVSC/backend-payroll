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
  const {
    correoDestino,
    empleado,
    cargo,
    sueldo_base,
    horas_extras,
    bonificaciones,
    multas,
    iess,
    fondos_reserva,
    decimo_tercero,
    decimo_cuarto,
    ingresos_adicionales,
    sueldo_neto
  } = req.body;

  const pdfPath = `recibo_${Date.now()}.pdf`;
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  // TÍTULO
  doc.fontSize(20).text("ROL DE PAGOS", { align: "center" });
  doc.moveDown();

  // DATOS DEL EMPLEADO
  doc.fontSize(12).text(`👤 Empleado: ${empleado}`);
  doc.text(`💼 Cargo: ${cargo}`);
  doc.moveDown();

  // DETALLES FINANCIEROS
  doc.text(`💰 Sueldo base: $${sueldo_base}`);
  doc.text(`⏱️ Horas extras: $${horas_extras}`);
  doc.text(`🎁 Bonificaciones: $${bonificaciones}`);
  doc.text(`⚠️ Multas: -$${multas}`);
  doc.text(`🏥 IESS: -$${iess}`);
  doc.text(`💵 Fondos de reserva: $${fondos_reserva}`);
  doc.text(`📅 Décimo tercero: $${decimo_tercero}`);
  doc.text(`📅 Décimo cuarto: $${decimo_cuarto}`);
  doc.text(`📈 Ingresos adicionales: $${ingresos_adicionales}`);
  doc.moveDown();

  // TOTAL
  doc.font("Helvetica-Bold").text(`🟢 Sueldo neto a pagar: $${sueldo_neto}`, { align: "center" });
  doc.moveDown();

  // PIE DE PÁGINA
  doc.font("Helvetica").fontSize(10).text("📌 Este recibo ha sido generado automáticamente por PAYROLL.", {
    align: "center"
  });

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
        subject: "📎 Recibo de Rol de Pagos en PDF",
        text: `Hola, adjunto encontrarás el recibo del rol de pagos de ${empleado}.`,
        attachments: [
          {
            filename: "RolDePagos.pdf",
            path: `./${pdfPath}`
          }
        ]
      });

      fs.unlinkSync(pdfPath); 

      res.status(200).send({ success: true, message: "PDF enviado al correo del administrador." });
    } catch (error) {
      console.error(error);
      res.status(500).send({ success: false, message: "Error al enviar el PDF." });
    }
  });
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});

