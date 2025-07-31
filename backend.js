const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/descargarRecibo', async (req, res) => {
  const datos = req.body;

  const doc = new PDFDocument();
  const filename = `recibo_${Date.now()}.pdf`;
  const filepath = path.join(__dirname, filename);
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  doc.fontSize(20).text('Recibo de Pago', { align: 'center' });
  doc.moveDown();

  Object.entries(datos).forEach(([key, value]) => {
    doc.fontSize(12).text(`${key}: ${value}`);
  });

  doc.end();

  stream.on('finish', () => {
    res.download(filepath, filename, () => {
      fs.unlinkSync(filepath);
    });
  });
});

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

  console.log("==== DATOS RECIBIDOS ====");
  console.log("correoDestino:", correoDestino);
  console.log("empleado:", empleado);
  console.log("sueldo_base:", sueldo_base);

  if (!correoDestino || correoDestino.trim() === "") {
    console.error("❌ Error: correoDestino está vacío.");
    return res.status(400).send({ success: false, message: "Correo destinatario no válido." });
  }

  const pdfPath = `recibo_${Date.now()}.pdf`;
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  doc.fontSize(20).text("ROL DE PAGOS", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`👤 Empleado: ${empleado}`);
  doc.text(`💼 Cargo: ${cargo}`);
  doc.moveDown();

  doc.text(`💰 Sueldo base: ${sueldo_base}`);
  doc.text(`⏱️ Horas extras: ${horas_extras}`);
  doc.text(`🎁 Bonificaciones: ${bonificaciones}`);
  doc.text(`⚠️ Multas: -${multas}`);
  doc.text(`🏥 IESS: -${iess}`);
  doc.text(`💵 Fondos de reserva: ${fondos_reserva}`);
  doc.text(`📅 Décimo tercero: ${decimo_tercero}`);
  doc.text(`📅 Décimo cuarto: ${decimo_cuarto}`);
  doc.text(`📈 Ingresos adicionales: ${ingresos_adicionales}`);
  doc.moveDown();

  doc.font("Helvetica-Bold").text(`🟢 Sueldo neto a pagar: ${sueldo_neto}`, { align: "center" });
  doc.moveDown();

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
        subject: "Recibo de Rol de Pagos en PDF",
        text: `Hola, adjunto encontrarás el recibo del rol de pagos del empleado seleccionado.`,
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
      console.error("❌ Error al enviar correo:", error);
      res.status(500).send({ success: false, message: "Error al enviar el PDF." });
    }
  });
});

app.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});


