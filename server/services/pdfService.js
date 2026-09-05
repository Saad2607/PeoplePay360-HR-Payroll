const PDFDocument = require('pdfkit');

/**
 * Formats a number as currency
 */
const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Formats a date as YYYY-MM-DD
 */
const formatDate = (d) => {
  if (!d) return 'N/A';
  const date = new Date(d);
  return isNaN(date.getTime()) ? 'N/A' : date.toISOString().split('T')[0];
};

/**
 * Generates a clean, professional vector PDF payslip buffer
 * @param {Object} payslip - Populated Payslip document
 * @returns {Promise<Buffer>} - Buffer containing the vector PDF
 */
const generatePayslipPdf = async (payslip) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Payslip-${payslip.payslipNumber}`,
          Author: 'PeoplePay360 HR & Payroll',
          Subject: `Salary Slip for ${payslip.employee?.name || 'Employee'}`
        }
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#1e3a8a';   // Deep Blue
      const secondaryColor = '#3b82f6'; // Light Blue
      const darkText = '#1f2937';       // Gray 800
      const mutedText = '#6b7280';      // Gray 500
      const lightBg = '#f3f4f6';        // Gray 100
      const borderColor = '#e5e7eb';    // Gray 200

      const pageWidth = doc.page.width; // ~595 pt
      const margin = 40;
      const contentWidth = pageWidth - margin * 2; // 515 pt

      // ==========================================
      // 1. HEADER SECTION
      // ==========================================
      doc.rect(margin, margin, contentWidth, 65).fill(primaryColor);

      doc.fillColor('#ffffff')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('PEOPLEPAY360', margin + 20, margin + 14);

      doc.fontSize(10)
        .font('Helvetica')
        .text('HR & PAYROLL PLATFORM • OFFICIAL SALARY SLIP', margin + 20, margin + 38);

      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text(`SLIP NO: ${payslip.payslipNumber || 'N/A'}`, pageWidth - margin - 220, margin + 18, {
          width: 200,
          align: 'right'
        });

      const status = payslip.status || 'Computed';
      doc.fontSize(9)
        .font('Helvetica')
        .text(`STATUS: ${status.toUpperCase()}`, pageWidth - margin - 220, margin + 36, {
          width: 200,
          align: 'right'
        });

      let currentY = margin + 80;

      // ==========================================
      // 2. COMPANY & EMPLOYEE INFO METADATA GRID
      // ==========================================
      const boxHeight = 110;
      const colWidth = (contentWidth - 15) / 2;

      // Employee Info Box (Left)
      doc.rect(margin, currentY, colWidth, boxHeight).fillAndStroke('#fafafa', borderColor);
      doc.fillColor(primaryColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('EMPLOYEE DETAILS', margin + 12, currentY + 10);

      const emp = payslip.employee || {};
      const empDept = emp.department?.name || 'Operations';
      const empRole = emp.jobPosition?.name || 'Staff';

      doc.fillColor(darkText).fontSize(8.5).font('Helvetica');
      doc.text(`Name:`, margin + 12, currentY + 30);
      doc.font('Helvetica-Bold').text(`${emp.name || 'N/A'}`, margin + 80, currentY + 30);

      doc.font('Helvetica').text(`Employee ID:`, margin + 12, currentY + 45);
      doc.font('Helvetica-Bold').text(`${emp.employeeId || 'N/A'}`, margin + 80, currentY + 45);

      doc.font('Helvetica').text(`Department:`, margin + 12, currentY + 60);
      doc.font('Helvetica-Bold').text(`${empDept}`, margin + 80, currentY + 60);

      doc.font('Helvetica').text(`Position:`, margin + 12, currentY + 75);
      doc.font('Helvetica-Bold').text(`${empRole}`, margin + 80, currentY + 75);

      doc.font('Helvetica').text(`Email:`, margin + 12, currentY + 90);
      doc.font('Helvetica-Bold').text(`${emp.email || 'N/A'}`, margin + 80, currentY + 90);

      // Pay Period & Payment Info Box (Right)
      const rightColX = margin + colWidth + 15;
      doc.rect(rightColX, currentY, colWidth, boxHeight).fillAndStroke('#fafafa', borderColor);
      doc.fillColor(primaryColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('PAYROLL SUMMARY', rightColX + 12, currentY + 10);

      const periodStr = `${formatDate(payslip.period?.startDate)} to ${formatDate(payslip.period?.endDate)}`;
      const contractNum = payslip.contract?.contractNumber || 'CTR-DEFAULT';
      const paymentMethod = payslip.payrun?.payment?.paymentMethod || 'Bank Transfer';

      doc.fillColor(darkText).fontSize(8.5).font('Helvetica');
      doc.text(`Pay Period:`, rightColX + 12, currentY + 30);
      doc.font('Helvetica-Bold').text(periodStr, rightColX + 85, currentY + 30);

      doc.font('Helvetica').text(`Payrun:`, rightColX + 12, currentY + 45);
      doc.font('Helvetica-Bold').text(`${payslip.payrun?.name || 'Standard Run'}`, rightColX + 85, currentY + 45);

      doc.font('Helvetica').text(`Contract:`, rightColX + 12, currentY + 60);
      doc.font('Helvetica-Bold').text(`${contractNum}`, rightColX + 85, currentY + 60);

      doc.font('Helvetica').text(`Worked Days:`, rightColX + 12, currentY + 75);
      doc.font('Helvetica-Bold').text(`${payslip.workedDays || 0} Days`, rightColX + 85, currentY + 75);

      doc.font('Helvetica').text(`Pay Method:`, rightColX + 12, currentY + 90);
      doc.font('Helvetica-Bold').text(`${paymentMethod}`, rightColX + 85, currentY + 90);

      currentY += boxHeight + 20;

      // ==========================================
      // 3. SALARY BREAKDOWN TABLE
      // ==========================================
      doc.fillColor(primaryColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('EARNINGS & DEDUCTIONS BREAKDOWN', margin, currentY);

      currentY += 18;

      // Table Headers
      const tableHeaderHeight = 22;
      doc.rect(margin, currentY, contentWidth, tableHeaderHeight).fill(lightBg);

      doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold');
      doc.text('CODE', margin + 10, currentY + 6);
      doc.text('DESCRIPTION', margin + 80, currentY + 6);
      doc.text('CATEGORY', margin + 260, currentY + 6);
      doc.text('AMOUNT', margin + 410, currentY + 6, { width: 90, align: 'right' });

      currentY += tableHeaderHeight;

      // Rules Rows
      const breakdown = payslip.salaryBreakdown || [];
      const earnings = breakdown.filter((r) => ['Basic', 'Allowances', 'Gross'].includes(r.category));
      const deductions = breakdown.filter((r) => r.category === 'Deductions');

      // Interleave earnings then deductions
      const displayRules = [
        ...earnings.filter((r) => r.category !== 'Gross'),
        ...deductions
      ];

      doc.font('Helvetica').fontSize(8.5);
      let isEven = false;

      for (const rule of displayRules) {
        const rowHeight = 20;
        if (isEven) {
          doc.rect(margin, currentY, contentWidth, rowHeight).fill('#f9fafb');
        }

        const isDeduction = rule.category === 'Deductions';
        doc.fillColor(darkText);
        doc.font('Helvetica-Bold').text(rule.code || '', margin + 10, currentY + 5);
        doc.font('Helvetica').text(rule.name || '', margin + 80, currentY + 5);
        doc.text(rule.category || '', margin + 260, currentY + 5);

        const amountStr = isDeduction ? `-${formatCurrency(rule.amount)}` : formatCurrency(rule.amount);
        if (isDeduction) {
          doc.fillColor('#dc2626'); // Red for deductions
        }
        doc.text(amountStr, margin + 410, currentY + 5, { width: 90, align: 'right' });

        // Row bottom line
        doc.strokeColor(borderColor).lineWidth(0.5)
          .moveTo(margin, currentY + rowHeight)
          .lineTo(margin + contentWidth, currentY + rowHeight)
          .stroke();

        currentY += rowHeight;
        isEven = !isEven;
      }

      currentY += 15;

      // ==========================================
      // 4. TOTALS & SUMMARY SECTION
      // ==========================================
      const summaryBoxWidth = 240;
      const summaryBoxX = margin + contentWidth - summaryBoxWidth;
      const summaryBoxY = currentY;

      doc.rect(summaryBoxX, summaryBoxY, summaryBoxWidth, 75).fillAndStroke('#fafafa', borderColor);

      doc.fillColor(darkText).fontSize(9.5).font('Helvetica');
      doc.text('Gross Salary:', summaryBoxX + 15, summaryBoxY + 10);
      doc.font('Helvetica-Bold').text(formatCurrency(payslip.gross), summaryBoxX + 130, summaryBoxY + 10, { width: 95, align: 'right' });

      doc.font('Helvetica').text('Total Deductions:', summaryBoxX + 15, summaryBoxY + 28);
      doc.fillColor('#dc2626').font('Helvetica-Bold').text(`-${formatCurrency(payslip.deductions)}`, summaryBoxX + 130, summaryBoxY + 28, { width: 95, align: 'right' });

      // Highlight Net Pay in bold primary block
      doc.rect(summaryBoxX, summaryBoxY + 46, summaryBoxWidth, 29).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
      doc.text('NET PAY:', summaryBoxX + 15, summaryBoxY + 54);
      doc.text(formatCurrency(payslip.net), summaryBoxX + 130, summaryBoxY + 54, { width: 95, align: 'right' });

      currentY = summaryBoxY + 95;

      // ==========================================
      // 5. FOOTER & COMPLIANCE NOTES
      // ==========================================
      const footerY = doc.page.height - margin - 40;
      doc.strokeColor(borderColor).lineWidth(1)
        .moveTo(margin, footerY - 10)
        .lineTo(margin + contentWidth, footerY - 10)
        .stroke();

      doc.fillColor(mutedText)
        .fontSize(8)
        .font('Helvetica')
        .text('CONFIDENTIAL • This is an electronically generated document. No physical signature is required.', margin, footerY, {
          width: contentWidth,
          align: 'center'
        });

      doc.text('PeoplePay360 HR & Payroll Core System • All rights reserved.', margin, footerY + 12, {
        width: contentWidth,
        align: 'center'
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generatePayslipPdf,
  formatCurrency,
  formatDate
};
