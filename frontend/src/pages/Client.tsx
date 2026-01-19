import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';

import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/layout/Modal';
import Table, { type Column } from '../components/ui/Table';
import { CLIENT_STORAGE_KEY, type ClientRecord } from '../models/client/client';

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
};

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: TextAreaFieldProps) {
  return (
    <label className="block space-y-1 text-sm font-medium text-black">
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-md border border-black/20 px-3 py-2 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
      />
    </label>
  );
}

function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim().replace(/\s+/g, '');
  const fullMatch = /^#?([0-9a-fA-F]{6})$/.exec(trimmed);
  if (fullMatch) return `#${fullMatch[1].toUpperCase()}`;
  const shortMatch = /^#?([0-9a-fA-F]{3})$/.exec(trimmed);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return null;
}

function buildId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Clients() {
  const nav = useNavigate();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [logoDataUrls, setLogoDataUrls] = useState<string[]>([]);
  const [logoLabels, setLogoLabels] = useState<string[]>([]);
  const [ctaColors, setCtaColors] = useState<string[]>(['#FACC15']);
  const [ctaColorInput, setCtaColorInput] = useState('#FACC15');
  const [customText, setCustomText] = useState('');
  const [tagline, setTagline] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');

  const normalizedColorInput = useMemo(
    () => normalizeHexColor(ctaColorInput),
    [ctaColorInput],
  );
  const colorPickerValue = normalizedColorInput ?? '#FACC15';

  useEffect(() => {
    const stored = localStorage.getItem(CLIENT_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const normalized = (
          parsed as (ClientRecord & {
            ctaColor?: string;
            ctaColors?: string[];
            logoPreview?: string;
            logoPreviews?: string[];
          })[]
        ).map((item) => ({
          ...item,
          ctaColors:
            Array.isArray(item.ctaColors) && item.ctaColors.length > 0
              ? item.ctaColors
              : item.ctaColor
                ? [item.ctaColor]
                : [],
          logoPreviews: Array.isArray(item.logoPreviews)
            ? item.logoPreviews
            : item.logoPreview
              ? [item.logoPreview]
              : [],
          accessList: Array.isArray(item.accessList) ? item.accessList : [],
        }));
        setClients(normalized);
      }
    } catch {
      setClients([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  function resetForm() {
    setCompanyName('');
    setLogoDataUrls([]);
    setLogoLabels([]);
    setCtaColors(['#FACC15']);
    setCtaColorInput('#FACC15');
    setCustomText('');
    setTagline('');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setNotes('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleLogoFileChange(fileList?: FileList | null) {
    if (!fileList || fileList.length === 0) {
      setLogoDataUrls([]);
      setLogoLabels([]);
      return;
    }
    const files = Array.from(fileList);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.error('Upload valid image files');
      return;
    }
    if (imageFiles.length !== files.length) {
      toast.error('Some files were skipped because they are not images');
    }
    try {
      const dataUrls = await Promise.all(
        imageFiles.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result || ''));
              reader.onerror = () => reject(new Error('Failed to read image'));
              reader.readAsDataURL(file);
            }),
        ),
      );
      setLogoDataUrls(dataUrls);
      setLogoLabels(imageFiles.map((file) => file.name));
    } catch {
      toast.error('Failed to load logo files');
    }
  }

  function handleAddColor() {
    const normalized = normalizeHexColor(ctaColorInput);
    if (!normalized) {
      toast.error('Enter a valid hex color');
      return;
    }
    if (ctaColors.includes(normalized)) {
      toast.error('Color already added');
      return;
    }
    setCtaColors((prev) => [...prev, normalized]);
    setCtaColorInput(normalized);
  }

  function handleRemoveColor(color: string) {
    setCtaColors((prev) => prev.filter((item) => item !== color));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors: string[] = [];
    const cleanedColors = ctaColors
      .map((color) => normalizeHexColor(color))
      .filter((color): color is string => Boolean(color));
    const uniqueColors = Array.from(new Set(cleanedColors));

    if (!companyName.trim()) errors.push('Company name is required');
    if (!customText.trim()) errors.push('Custom text is required');
    if (uniqueColors.length === 0) errors.push('Add at least one CTA color');
    if (contactEmail && !contactEmail.includes('@')) {
      errors.push('Enter a valid contact email');
    }

    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    const newClient: ClientRecord = {
      id: buildId(),
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      customText: customText.trim(),
      tagline: tagline.trim(),
      ctaColors: uniqueColors,
      logoPreviews: logoDataUrls,
      notes: notes.trim(),
      accessList: [],
      createdAt: new Date().toLocaleString(),
    };

    setClients((prev) => [newClient, ...prev]);
    toast.success('Client created');
    resetForm();
    setCreateOpen(false);
  }

  const columns: Column<ClientRecord>[] = [
    { key: 'index', label: 'S.No', render: (_, index) => index + 1 },
    {
      key: 'companyName',
      label: 'Company',
      render: (row) => (
        <div>
          <div className="font-semibold text-black">{row.companyName}</div>
          {row.tagline ? <div className="text-xs text-black/60">{row.tagline}</div> : null}
        </div>
      ),
    },
    {
      key: 'contactEmail',
      label: 'Contact',
      render: (row) => (
        <div className="text-xs text-black/70">
          {row.contactName ? <div className="font-medium text-black">{row.contactName}</div> : null}
          {row.contactEmail ? <div>{row.contactEmail}</div> : null}
          {row.contactPhone ? <div>{row.contactPhone}</div> : null}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => <span className="text-xs text-black/60">{row.createdAt}</span>,
    },
    {
      key: 'details',
      label: 'Details',
      render: (row) => (
        <button
          type="button"
          onClick={() => nav(`/admin/client/${row.id}`)}
          className="p-2 rounded-md border border-black/10 hover:bg-yellow-100"
          aria-label={`View details for ${row.companyName}`}
          title="View details"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black">Clients</h1>
          <p className="text-sm text-black/60">
            Add client details to spin up customized websites quickly.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ Create client</Button>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create client" size="lg">
        <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1">
            <p className="text-sm text-black/60">
              Capture brand, contact, and content details for the client&apos;s custom site.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Company name"
              placeholder="Enter company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <Input
              label="Tagline"
              placeholder="One line brand tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Primary contact name"
              placeholder="Contact person"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <Input
              label="Contact email"
              placeholder="name@company.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Contact phone"
              placeholder="+91 98765 43210"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
            <label className="block space-y-1 text-sm font-medium text-black">
              <span>CTA colors</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colorPickerValue}
                  onChange={(e) => setCtaColorInput(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-md border border-black/20 bg-white p-1"
                />
                <input
                  type="text"
                  value={ctaColorInput}
                  onChange={(e) => setCtaColorInput(e.target.value)}
                  className="w-full rounded-md border border-black/20 px-3 py-2 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                  placeholder="#FACC15"
                />
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="rounded-md border border-black/20 px-3 py-2 text-xs font-semibold text-black hover:bg-yellow-100"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {ctaColors.length === 0 ? (
                  <span className="text-xs text-black/50">No colors added yet.</span>
                ) : (
                  ctaColors.map((color) => (
                    <div
                      key={color}
                      className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-2 py-1 text-xs"
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-black/10"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-black/70">{color}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(color)}
                        className="text-black/40 hover:text-black"
                        aria-label={`Remove color ${color}`}
                      >
                        x
                      </button>
                    </div>
                  ))
                )}
              </div>
            </label>
          </div>

          <label className="block space-y-1 text-sm font-medium text-black">
            <span>Company logo file</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => void handleLogoFileChange(e.target.files)}
              className="w-full rounded-md border border-black/20 px-3 py-2 text-sm text-black file:mr-4 file:rounded-md file:border-0 file:bg-yellow-100 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-black"
            />
            {logoLabels.length > 0 ? (
              <span className="text-xs text-black/60">
                {logoLabels.length} file{logoLabels.length === 1 ? '' : 's'} selected
              </span>
            ) : null}
          </label>

          <TextAreaField
            label="Custom text"
            placeholder="Custom headline or CTA text for the website"
            value={customText}
            onChange={setCustomText}
            rows={2}
          />

          <TextAreaField
            label="Website requirements"
            placeholder="Brand guidelines, required sections, special notes"
            value={notes}
            onChange={setNotes}
            rows={3}
          />

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={resetForm}>
              Clear
            </Button>
            <Button type="submit">Create client</Button>
          </div>
        </form>
      </Modal>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black">Clients</h2>
          <span className="text-xs text-black/50">{clients.length} total</span>
        </div>
        {clients.length === 0 ? (
          <div className="rounded-lg border border-dashed border-black/10 bg-white p-6 text-sm text-black/60">
            No clients created yet. Use the create client button to add the first client.
          </div>
        ) : (
          <Table columns={columns} data={clients} />
        )}
      </section>
    </div>
  );
}
