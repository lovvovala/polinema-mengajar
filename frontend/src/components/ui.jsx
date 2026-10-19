import { Link } from 'react-router-dom';

/* ---------- Logo ---------- */
export function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-lg font-extrabold text-white shadow-card">
        P
      </span>
      <span className={`text-base font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
        Polinema <span className="text-brand-600">Mengajar</span>
      </span>
    </Link>
  );
}

/* ---------- Button ---------- */
const VARIAN = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 disabled:bg-brand-300',
  secondary: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:text-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  ghost: 'text-brand-700 hover:bg-brand-50',
};
const UKURAN = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };

export function Button({ variant = 'primary', size = 'md', loading = false, className = '', children, ...props }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-brand-500 disabled:cursor-not-allowed ${VARIAN[variant]} ${UKURAN[size]} ${className}`}
    >
      {loading && <Spinner small />}
      {children}
    </button>
  );
}

export function LinkButton({ to, variant = 'primary', size = 'md', className = '', children }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition ${VARIAN[variant]} ${UKURAN[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

/* ---------- Card ---------- */
export function Card({ className = '', children }) {
  return <div className={`rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200/70 ${className}`}>{children}</div>;
}

/* ---------- Form fields ---------- */
const dasarInput =
  'block w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600';

export function Field({ label, htmlFor, error, hint, required, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({ error, className = '', ...props }) {
  return (
    <input
      {...props}
      aria-invalid={!!error}
      className={`${dasarInput} ${error ? 'ring-red-400' : 'ring-slate-300'} ${className}`}
    />
  );
}

export function TextArea({ error, className = '', ...props }) {
  return (
    <textarea
      {...props}
      aria-invalid={!!error}
      className={`${dasarInput} ${error ? 'ring-red-400' : 'ring-slate-300'} ${className}`}
    />
  );
}

export function SelectInput({ error, className = '', children, ...props }) {
  return (
    <select
      {...props}
      aria-invalid={!!error}
      className={`${dasarInput} ${error ? 'ring-red-400' : 'ring-slate-300'} ${className}`}
    >
      {children}
    </select>
  );
}

/* ---------- Badge, Alert, Spinner ---------- */
const NADA = {
  netral: 'bg-slate-100 text-slate-700',
  biru: 'bg-brand-100 text-brand-800',
  hijau: 'bg-emerald-100 text-emerald-800',
  kuning: 'bg-amber-100 text-amber-800',
  merah: 'bg-red-100 text-red-800',
};

export function Badge({ tone = 'netral', children }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${NADA[tone]}`}>{children}</span>;
}

const ALERT = {
  info: 'bg-brand-50 text-brand-900 ring-brand-200',
  sukses: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  peringatan: 'bg-amber-50 text-amber-900 ring-amber-200',
  galat: 'bg-red-50 text-red-900 ring-red-200',
};

export function Alert({ tone = 'info', children, className = '' }) {
  return (
    <div role={tone === 'galat' ? 'alert' : 'status'} className={`rounded-xl p-4 text-sm ring-1 ring-inset ${ALERT[tone]} ${className}`}>
      {children}
    </div>
  );
}

export function Spinner({ small = false }) {
  return (
    <span
      aria-label="Memuat"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${small ? 'h-4 w-4' : 'h-8 w-8 text-brand-600'}`}
    />
  );
}

export function LayarMemuat({ pesan = 'Memuat...' }) {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <Spinner />
        <p className="text-sm">{pesan}</p>
      </div>
    </div>
  );
}

/* ---------- Stepper ---------- */
export function Stepper({ langkah, aktif }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Langkah pendaftaran">
      {langkah.map((nama, i) => {
        const selesai = i < aktif;
        const kini = i === aktif;
        return (
          <li key={nama} className="flex flex-1 items-center gap-2" aria-current={kini ? 'step' : undefined}>
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                selesai ? 'bg-brand-700 text-white' : kini ? 'bg-brand-100 text-brand-800 ring-2 ring-brand-600' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {selesai ? '✓' : i + 1}
            </span>
            <span className={`hidden text-sm font-semibold sm:block ${kini ? 'text-slate-900' : 'text-slate-500'}`}>{nama}</span>
            {i < langkah.length - 1 && <span className={`h-0.5 flex-1 rounded ${selesai ? 'bg-brand-600' : 'bg-slate-200'}`} />}
          </li>
        );
      })}
    </ol>
  );
}
