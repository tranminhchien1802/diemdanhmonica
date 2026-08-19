import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHead, EmptyState } from '../components/ui';
import { fmtMoney } from '../utils/helpers';

const monthLabel = (mk) => {
  const [y, m] = mk.split('-');
  const names = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  return `${names[Number(m)]} · ${y}`;
};

export default function Payslip() {
  const { currentUser, db } = useApp();
  const slips = useMemo(
    () => db.payslips.filter((p) => p.userId === currentUser?.id).sort((a, b) => b.month.localeCompare(a.month)),
    [db, currentUser],
  );
  const [sel, setSel] = useState(slips[0]?.month);

  const slip = slips.find((s) => s.month === sel) || slips[0];

  const rows = slip ? [
    { label: 'Lương cơ bản', value: slip.baseSalary, tone: 'plus' },
    { label: 'Phụ cấp', value: slip.allowances, tone: 'plus' },
    { label: 'Tăng ca (OT)', value: slip.otPay, tone: 'plus' },
    { label: 'Thưởng / KPI', value: slip.bonus || 0, tone: 'plus' },
    { label: 'Bảo hiểm (BHXH 10.5%)', value: slip.insurance, tone: 'minus' },
    { label: 'Khấu trừ vi phạm', value: slip.penalty || 0, tone: 'minus' },
  ] : [];

  const totalPlus = slip ? slip.baseSalary + slip.allowances + slip.otPay + (slip.bonus || 0) : 0;
  const totalMinus = slip ? slip.insurance + (slip.penalty || 0) : 0;

  return (
    <div>
      <PageHead title="Bảng lương" sub="Xem chi tiết thu nhập và các khoản khấu trừ" />

      <div className="card payslip-card">
        <div className="payslip-head">
          <div>
            <h3>Phiếu lương {slip ? monthLabel(slip.month) : ''}</h3>
            <p className="muted">{currentUser?.name} · {currentUser?.department} · {currentUser?.position}</p>
          </div>
          <div>
            {slips.length > 1 && (
              <select className="input small" value={sel} onChange={(e) => setSel(e.target.value)}>
                {slips.map((s) => <option key={s.month} value={s.month}>{monthLabel(s.month)}</option>)}
              </select>
            )}
          </div>
        </div>

        {!slip ? (
          <EmptyState icon="💰" text="Chưa có bảng lương nào được tạo" />
        ) : (
          <>
            <div className="net-box">
              <span>Thu nhập thực nhận</span>
              <b>{fmtMoney(slip.net)}</b>
              <small>Ngày xuất: {slip.generatedDate}</small>
            </div>
            <div className="slip-rows">
              <div className="slip-row head">
                <span>Khoản mục</span><span className="num">Số tiền</span>
              </div>
              {rows.map((r) => (
                <div key={r.label} className="slip-row">
                  <span>{r.label}</span>
                  <span className={`num ${r.tone}`}>{r.tone === 'minus' ? '−' : '+'}{fmtMoney(r.value)}</span>
                </div>
              ))}
              <div className="slip-row sub">
                <span>Tổng cộng</span>
                <span className="num">{fmtMoney(slip.net)}</span>
              </div>
            </div>
            <div className="slip-note">
              <p className="muted small">
                Tổng thu nhập: <b>{fmtMoney(totalPlus)}</b> · Tổng khấu trừ: <b>{fmtMoney(totalMinus)}</b> ·
                Tăng ca ước tính theo hệ số OT {db.policy.otRate}. Mọi thắc mắc liên hệ Phòng Nhân sự.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
