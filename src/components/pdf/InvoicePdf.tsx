import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font, Image,
} from '@react-pdf/renderer';

// تسجيل خط Cairo (من Google Fonts CDN)
Font.register({
  family: 'Cairo',
  fonts: [
    { src: '/fonts/Cairo-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Cairo-Bold.ttf', fontWeight: 700 },
  ],
});

// تعطيل hyphenation (لكسر الكلمات العربية)
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Cairo',
    fontSize: 10,
    padding: 30,
    direction: 'rtl',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginBottom: 12,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
  },
  companyDetails: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 4,
  },
  docType: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f766e',
  },
  docNumber: {
    fontSize: 9,
    color: '#334155',
    marginTop: 4,
  },
  party: {
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    marginBottom: 12,
  },
  partyTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#1e293b',
  },
  partyDetails: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 3,
  },
  table: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f766e',
    padding: 6,
  },
  tableHeaderCell: {
    color: 'white',
    fontSize: 8,
    fontWeight: 700,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  tableCell: {
    fontSize: 8,
    color: '#1e293b',
  },
  summary: {
    alignSelf: 'flex-start',
    width: '50%',
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#334155',
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: 700,
    color: '#1e293b',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    paddingTop: 5,
    marginTop: 3,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#0f766e',
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 700,
    color: '#0f766e',
  },
  amountInWords: {
    padding: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 4,
    marginBottom: 12,
    fontSize: 9,
    color: '#166534',
  },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  signatureBox: {
    width: '45%',
    textAlign: 'center',
  },
  signatureLabel: {
    fontSize: 9,
    color: '#334155',
    marginBottom: 30,
  },
  signatureLine: {
    borderTopWidth: 0.5,
    borderTopColor: '#94a3b8',
    paddingTop: 4,
    fontSize: 8,
    color: '#64748b',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 7,
    color: '#94a3b8',
    borderTopWidth: 0.5,
    borderTopColor: '#cbd5e1',
    paddingTop: 6,
  },
});

export interface InvoicePdfProps {
  company: {
    name: string;
    tax_number?: string;
    phone?: string;
    address?: string;
  };
  docType: 'sale_invoice' | 'purchase_invoice';
  docNumber: string;
  docDate: string;
  partyTitle: string;
  party: {
    name: string;
    phone?: string;
    email?: string;
    tax_number?: string;
    address?: string;
  };
  items: Array<{
    name: string;
    sku?: string;
    quantity: number;
    unit_price: number;
    tax?: string;
    total: number;
  }>;
  summary: Array<{
    label: string;
    value: number;
    isTotal?: boolean;
  }>;
  amountInWords?: string;
  currencyCode: string;
  extraInfo?: Record<string, string>;
  notes?: string;
}

export const InvoicePdf: React.FC<InvoicePdfProps> = ({
  company,
  docType,
  docNumber,
  docDate,
  partyTitle,
  party,
  items,
  summary,
  amountInWords,
  currencyCode,
  extraInfo,
  notes,
}) => {
  const docLabel = docType === 'sale_invoice' ? 'فاتورة مبيعات' : 'فاتورة مشتريات';
  const fmt = (n: number) => Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* الرأس */}
        <View style={styles.header}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Text style={styles.docType}>{docLabel}</Text>
            <Text style={styles.docNumber}>رقم: {docNumber}</Text>
            <Text style={styles.docNumber}>التاريخ: {docDate}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.companyName}>{company.name}</Text>
            {company.tax_number && <Text style={styles.companyDetails}>الرقم الضريبي: {company.tax_number}</Text>}
            {company.phone && <Text style={styles.companyDetails}>الهاتف: {company.phone}</Text>}
            {company.address && <Text style={styles.companyDetails}>{company.address}</Text>}
          </View>
        </View>

        {/* الطرف */}
        <View style={styles.party}>
          <Text style={styles.partyTitle}>{partyTitle}: {party.name}</Text>
          {party.phone && (
            <Text style={styles.partyDetails}>
              الهاتف: {party.phone}
              {party.tax_number ? ` | الرقم الضريبي: ${party.tax_number}` : ''}
              {party.address ? ` | ${party.address}` : ''}
            </Text>
          )}
        </View>

        {/* معلومات إضافية */}
        {extraInfo && Object.keys(extraInfo).length > 0 && (
          <View style={{ marginBottom: 10 }}>
            {Object.entries(extraInfo).filter(([, v]) => v).map(([k, v]) => (
              <Text key={k} style={{ fontSize: 8, color: '#64748b', marginBottom: 2 }}>
                {k}: {v}
              </Text>
            ))}
          </View>
        )}

        {/* الجدول */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '5%' }]}>#</Text>
            <Text style={[styles.tableHeaderCell, { width: '40%' }]}>الصنف</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>SKU</Text>
            <Text style={[styles.tableHeaderCell, { width: '8%' }]}>الكمية</Text>
            <Text style={[styles.tableHeaderCell, { width: '10%' }]}>السعر</Text>
            <Text style={[styles.tableHeaderCell, { width: '8%' }]}>الضريبة</Text>
            <Text style={[styles.tableHeaderCell, { width: '14%' }]}>الإجمالي</Text>
          </View>

          {items.map((it, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 ? { backgroundColor: '#f8fafc' } : {}]}>
              <Text style={[styles.tableCell, { width: '5%', textAlign: 'center' }]}>{i + 1}</Text>
              <Text style={[styles.tableCell, { width: '40%' }]}>{it.name}</Text>
              <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>{it.sku || '—'}</Text>
              <Text style={[styles.tableCell, { width: '8%', textAlign: 'center' }]}>{it.quantity}</Text>
              <Text style={[styles.tableCell, { width: '10%', textAlign: 'left' }]}>{fmt(it.unit_price)}</Text>
              <Text style={[styles.tableCell, { width: '8%', textAlign: 'center' }]}>{it.tax || '—'}</Text>
              <Text style={[styles.tableCell, { width: '14%', textAlign: 'left', fontWeight: 700 }]}>{fmt(it.total)}</Text>
            </View>
          ))}
        </View>

        {/* المجاميع */}
        <View style={styles.summary}>
          {summary.map((row, i) => (
            <View
              key={i}
              style={[styles.summaryRow, row.isTotal ? styles.totalRow : {}]}
            >
              <Text style={row.isTotal ? styles.totalLabel : styles.summaryLabel}>{row.label}</Text>
              <Text style={row.isTotal ? styles.totalValue : styles.summaryValue}>
                {fmt(row.value)} {currencyCode}
              </Text>
            </View>
          ))}
        </View>

        {/* المبلغ بالحروف */}
        {amountInWords && (
          <View style={styles.amountInWords}>
            <Text><Text style={{ fontWeight: 700 }}>المبلغ بالحروف: </Text>{amountInWords}</Text>
          </View>
        )}

        {/* ملاحظات */}
        {notes && (
          <View style={{ padding: 8, backgroundColor: '#fef9c3', borderRadius: 4, marginBottom: 12 }}>
            <Text style={{ fontSize: 9, color: '#854d0e' }}>
              <Text style={{ fontWeight: 700 }}>ملاحظات: </Text>{notes}
            </Text>
          </View>
        )}

        {/* التوقيعات */}
        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>توقيع المستلم</Text>
            <View style={styles.signatureLine}>
              <Text>التاريخ: ____ / ____ / ________</Text>
            </View>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>توقيع المُصدِر</Text>
            <View style={styles.signatureLine}>
              <Text>الختم الرسمي</Text>
            </View>
          </View>
        </View>

        {/* التذييل */}
        <Text style={styles.footer} fixed>
          تم إنشاؤه بواسطة PharmaCore ERP — {new Date().toLocaleString('ar-SA')}
        </Text>
      </Page>
    </Document>
  );
};