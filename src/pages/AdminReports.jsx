import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHead, StatCard, Badge, Avatar, EmptyState } from '../components/ui';
import { monthKey } from '../utils/helpers';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const { db, toast } = useApp();
  const [mk, setMk] = useState(monthKey());
  const [deptF, setDeptF] = useState('all');

  const months = useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return arr;
  }, []);

  const report = useMemo(() => {
    const depts = {};
    const rows = [];
    for (const u of db.users) {
      if (u.role === 'super_admin') continue;
      if (deptF !== 'all' && u.department !== deptF) continue;
      const att = db.attendance.filter((a) => a.userId === u.id && a.date.startsWith(mk));
      const present = att.filter((a) => a.status !== 'absent').length;
      const onTime = att.filter((a) => a.status === 'on_time').length;
      const late = att.filter((a) => a.status === 'late').length;
      const early = att.filter((a) => a.status === 'early_leave').length;
      const absent = att.filter((a) => a.status === 'absent').length;
      const ot = att.reduce((s, a) => s + (a.otHours || 0), 0);
      const violations = late + early;
      rows.push({
        id: u.id, name: u.name, dept: u.department, position: u.position, present, onTime, late, early, absent, ot, violations,
      });
      depts[u.department] = depts[u.department] || { present: 0, late: 0, early: 0, absent: 0, ot: 0, violations: 0 };
      depts[u.department].present += present;
      depts[u.department].late += late;
      depts[u.department].early += early;
      depts[u.department].absent += absent;
      depts[u.department].ot += ot;
      depts[u.department].violations += violations;
    }
    const total = rows.reduce((s, r) => ({ present: s.present + r.present, late: s.late + r.late, early: s.early + r.early, absent: s.absent + r.absent, ot: s.ot + r.ot, violations: s.violations + r.violations }), { present: 0, late: 0, early: 0, absent: 0, ot: 0, violations: 0 });
    return { rows, depts: Object.entries(depts).map(([k, v]) => ({ dept: k, ...v })), total };
  }, [db, mk, deptF]);

  const exportExcel = () => {
    const head = [['BÁO CÁO CHẤM CÔNG THÁNG ' + mk, '', '', '', '', '', '', '', '']];
    const tHead = [['STT', 'Nhân viên', 'Phòng ban', 'Chức vụ', 'Ngày công', 'Đúng giờ', 'Đi muộn', 'Về sớm', 'Vắng', 'Tăng ca (h)', 'Vi phạm']];
    const data = report.rows.map((r, i) => [i + 1, r.name, r.dept, r.position, r.present, r.onTime, r.late, r.early, r.absent, r.ot, r.violations]);
    const ws = XLSX.utils.aoa_to_sheet([...head, ...tHead, ...data]);
    ws['!cols'] = [{ wch: 4 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 7 }, { wch: 10 }, { wch: 9 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chấm công');
    XLSX.writeFile(wb, `BaoCao_ChamCong_${mk}.xlsx`);
    toast('Đã xuất file Excel');
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text(`BÁO CÁO CHẤM CÔNG THÁNG ${mk}`, 14, 14);
    doc.setFontSize(10);
    doc.text(`Monica HR · Xuất ngày ${new Date().toLocaleDateString('vi-VN')}`, 14, 20);
    autoTable(doc, {
      startY: 26,
      head: [['STT', 'Nhân viên', 'Phòng ban', 'Chức vụ', 'Ngày công', 'Đúng giờ', 'Muộn', 'Sớm', 'Vắng', 'OT(h)', 'Vi phạm']],
      body: report.rows.map((r, i) => [i + 1, r.name, r.dept, r.position, r.present, r.onTime, r.late, r.early, r.absent, r.ot, r.violations]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
    });
    doc.save(`BaoCao_ChamCong_${mk}.pdf`);
    toast('Đã xuất file PDF');
  };

  return (
    <div>
      <PageHead
        title="Tổng hợp công & Báo cáo"
        sub="Tự động tổng hợp số ngày công, giờ làm thêm, số lần vi phạm phục vụ tính lương"
        actions={
          <>
            <button className="btn" onClick={exportExcel}>📊 Xuất Excel</button>
            <button className="btn primary" onClick={exportPDF}>📄 Xuất PDF</button>
          </>
        }
      />

      <div className="filter-row">
        <select className="input small" value={mk} onChange={(e) => setMk(e.target.value)}>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="input small" value={deptF} onChange={(e) => setDeptF(e.target.value)}>
          <option value="all">Tất cả phòng ban</option>
          {[...new Set(db.users.filter((u) => u.role !== 'super_admin').map((u) => u.department))].map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="grid stats-4">
        <StatCard icon="✅" label="Tổng ngày công" value={report.total.present} tone="green" />
        <StatCard icon="⏰" label="Tổng đi muộn" value={report.total.late} tone="amber" />
        <StatCard icon="🏠" label="Tổng về sớm" value={report.total.early} tone="red" />
        <StatCard icon="🕐" label="Tổng giờ tăng ca" value={`${report.total.ot}h`} sub={`${report.total.violations} vi phạm nội quy`} tone="indigo" />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Nhân viên</th><th>Phòng ban</th><th>Ngày công</th><th>Đúng giờ</th><th>Đi muộn</th><th>Về sớm</th><th>Vắng</th><th>Tăng ca</th><th>Vi phạm</th></tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <tr key={r.id}>
                  <td><div className="cell-user"><Avatar user={db.users.find((u) => u.id === r.id)} size={32} /><div><b>{r.name}</b><small className="d-block muted">{r.position}</small></div></div></td>
                  <td>{r.dept}</td>
                  <td><b>{r.present}</b></td>
                  <td><Badge label={r.onTime} color="green" /></td>
                  <td>{r.late > 0 ? <Badge label={r.late} color="amber" /> : r.late}</td>
                  <td>{r.early > 0 ? <Badge label={r.early} color="red" /> : r.early}</td>
                  <td>{r.absent}</td>
                  <td>{r.ot}h</td>
                  <td>{r.violations > 0 ? <Badge label={`${r.violations} lần`} color="red" /> : '—'}</td>
                </tr>
              ))}
              {report.rows.length === 0 && <tr><td colSpan="9"><EmptyState icon="📊" text="Không có dữ liệu" /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}