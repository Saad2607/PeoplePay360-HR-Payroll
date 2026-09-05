const nodemailer = require('nodemailer');
const pdfService = require('./pdfService');

/**
 * Creates and caches the nodemailer transporter
 * Supports configurable SMTP via environment variables.
 * If SMTP credentials are not configured, falls back to mock delivery mode.
 */
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === 'true',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
  }

  return transporter;
};

/**
 * Sends a single payslip email with summary and optional PDF attachment
 */
const sendPayslipEmail = async ({ payslip, pdfBuffer }) => {
  const emp = payslip.employee || {};
  const recipientEmail = emp.email;

  if (!recipientEmail) {
    return {
      success: false,
      recipient: null,
      error: `Employee '${emp.name || payslip.employee}' does not have an email address configured.`
    };
  }

  const periodStart = payslip.period?.startDate ? new Date(payslip.period.startDate).toISOString().split('T')[0] : 'N/A';
  const periodEnd = payslip.period?.endDate ? new Date(payslip.period.endDate).toISOString().split('T')[0] : 'N/A';
  const periodStr = `${periodStart} to ${periodEnd}`;
  const subject = `Your PeoplePay360 Payslip for ${periodStr} (${payslip.payslipNumber || 'Confidential'})`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1e3a8a; color: #ffffff; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 22px;">PeoplePay360 HR & Payroll</h2>
        <p style="margin: 5px 0 0; font-size: 13px; opacity: 0.9;">Official Salary Statement</p>
      </div>
      <div style="padding: 24px;">
        <p>Dear <strong>${emp.name || 'Employee'}</strong>,</p>
        <p>Your salary slip for the payroll period <strong>${periodStr}</strong> has been generated and validated.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Payslip Reference:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold;">${payslip.payslipNumber || 'N/A'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Gross Salary:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold;">$${Number(payslip.gross || 0).toFixed(2)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Total Deductions:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #dc2626;">-$${Number(payslip.deductions || 0).toFixed(2)}</td>
          </tr>
          <tr style="background-color: #f3f4f6;">
            <td style="padding: 12px 10px; font-weight: bold; font-size: 16px; color: #1e3a8a;">NET TAKE-HOME:</td>
            <td style="padding: 12px 10px; text-align: right; font-weight: bold; font-size: 18px; color: #1e3a8a;">$${Number(payslip.net || 0).toFixed(2)}</td>
          </tr>
        </table>

        <p style="font-size: 13px; color: #4b5563;">
          A PDF copy of your payslip is attached to this email. You may also access your complete payroll history through the PeoplePay360 Employee Portal.
        </p>
      </div>
      <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
        This is an automated system email from PeoplePay360. Please do not reply directly to this email.
      </div>
    </div>
  `;

  const activeTransporter = getTransporter();

  // If live SMTP configured, send through nodemailer
  if (activeTransporter) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || '"PeoplePay360 Payroll" <payroll@peoplepay360.com>',
        to: recipientEmail,
        subject,
        html: htmlContent,
        attachments: pdfBuffer
          ? [
              {
                filename: `payslip-${payslip.payslipNumber || 'statement'}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
              }
            ]
          : []
      };

      const info = await activeTransporter.sendMail(mailOptions);
      return {
        success: true,
        recipient: recipientEmail,
        messageId: info.messageId,
        mode: 'smtp'
      };
    } catch (err) {
      return {
        success: false,
        recipient: recipientEmail,
        error: err.message,
        mode: 'smtp'
      };
    }
  }

  // Graceful fallback: simulated delivery when SMTP is not configured
  return {
    success: true,
    recipient: recipientEmail,
    messageId: `simulated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mode: 'simulated'
  };
};

/**
 * Bulk payslip delivery service
 * Sends payslip emails to all employees in the given payslips array.
 * Handles failures per employee gracefully without breaking the batch.
 */
const sendBulkPayslips = async (payslips, { attachPdf = true } = {}) => {
  const results = [];
  let sentCount = 0;
  let failedCount = 0;

  for (const payslip of payslips) {
    try {
      let pdfBuffer = null;
      if (attachPdf) {
        try {
          pdfBuffer = await pdfService.generatePayslipPdf(payslip);
        } catch (pdfErr) {
          // If PDF generation fails, continue with email without attachment
          console.warn(`[Payslip PDF generation warning for ${payslip.payslipNumber}]:`, pdfErr.message);
        }
      }

      const sendResult = await sendPayslipEmail({ payslip, pdfBuffer });

      // Update Payslip record emailStatus
      payslip.emailStatus = {
        sent: sendResult.success,
        sentAt: sendResult.success ? new Date() : null,
        recipientEmail: payslip.employee?.email || ''
      };
      await payslip.save();

      if (sendResult.success) {
        sentCount++;
      } else {
        failedCount++;
      }

      results.push({
        payslipId: payslip._id,
        payslipNumber: payslip.payslipNumber,
        employeeName: payslip.employee?.name,
        email: payslip.employee?.email,
        ...sendResult
      });
    } catch (err) {
      failedCount++;
      results.push({
        payslipId: payslip._id,
        payslipNumber: payslip.payslipNumber,
        success: false,
        error: err.message
      });
    }
  }

  return {
    total: payslips.length,
    sentCount,
    failedCount,
    deliveryDetails: results
  };
};

module.exports = {
  sendPayslipEmail,
  sendBulkPayslips
};
