const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/send-pdf", async (req, res) => {
  const { correoDestino, empleado, cargo, sueldo, horasExtras, total } = req.body;

  const html = `
    <div style="font-family: Arial; padding: 20px; border: 1px solid #ccc;">
      <h2>📄 ROL DE PAGOS</h2>
      <p><strong>Empleado:</strong> ${empleado}</p>
      <p><strong>Cargo:</strong> ${cargo}</p>
      <p><strong>Sueldo base:</strong> $${sueldo}</p>
      <p><strong>Horas extras:</strong> ${horasExtras}</p>
      <p><strong>Total a pagar:</strong> $${total}</p>
      <br />
      <p style="text-align:center;">Enviado automáticamente desde PAYROLL</p>
    </div>
  `;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
  });

  try {
    await transporter.sendMail({
      from: '"PAYROLL" <alialanuca05@gmail.com>',
      to: correoDestino,
      subject: "📄 Recibo de Rol de Pagos",
      html,
    });

    res.status(200).send({ success: true, message: "Correo enviado con éxito." });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Error al enviar el correo." });
  }
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
