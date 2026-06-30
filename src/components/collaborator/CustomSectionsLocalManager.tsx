import { useState } from 'react';
import {
  Plus as LucidePlus,
  Trash2 as LucideTrash2,
  GripVertical as LucideGripVertical,
  ChevronUp as LucideChevronUp,
  ChevronDown as LucideChevronDown,
  Edit2 as LucideEdit2
} from 'lucide-react';

const Plus = LucidePlus as any;
const Trash2 = LucideTrash2 as any;
const GripVertical = LucideGripVertical as any;
const ChevronUp = LucideChevronUp as any;
const ChevronDown = LucideChevronDown as any;
const Edit2 = LucideEdit2 as any;

export interface CustomSectionState {
  id?: string;
  section_type: string;
  title: string;
  content: string;
  display_order: number;
  is_active: boolean;
}

interface CustomSectionsLocalManagerProps {
  sections: CustomSectionState[];
  onChange: (sections: CustomSectionState[]) => void;
}

export function CustomSectionsLocalManager({ sections, onChange }: CustomSectionsLocalManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editContent, setEditContent] = useState<{ title: string; content: string }>({ title: '', content: '' });
  
  const [newSection, setNewSection] = useState({
    section_type: 'text',
    title: '',
    content: '',
  });

  const addSection = () => {
    if (!newSection.title) {
      alert('Preencha o título da seção');
      return;
    }
    const updated = [
      ...sections,
      {
        section_type: newSection.section_type,
        title: newSection.title,
        content: newSection.content,
        display_order: sections.length,
        is_active: true
      }
    ];
    onChange(updated);
    setNewSection({ section_type: 'text', title: '', content: '' });
  };

  const removeSection = (index: number) => {
    if (confirm('Tem certeza que deseja excluir esta seção?')) {
      const updated = sections
        .filter((_, i) => i !== index)
        .map((sec, i) => ({ ...sec, display_order: i }));
      onChange(updated);
    }
  };

  const toggleVisibility = (index: number, currentActive: boolean) => {
    const updated = sections.map((sec, i) =>
      i === index ? { ...sec, is_active: !currentActive } : sec
    );
    onChange(updated);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...sections];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    
    const reordered = updated.map((sec, i) => ({ ...sec, display_order: i }));
    onChange(reordered);
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditContent({ title: sections[index].title, content: sections[index].content });
  };

  const saveEdit = (index: number) => {
    const updated = sections.map((sec, i) =>
      i === index ? { ...sec, title: editContent.title, content: editContent.content } : sec
    );
    onChange(updated);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Form to Add Section */}
      <div className="border border-white/10 rounded-xl p-6 bg-white/5 space-y-4">
        <h3 className="text-base font-bold text-white font-display">Adicionar Nova Seção Customizada</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
              Tipo de Seção
            </label>
            <select
              value={newSection.section_type}
              onChange={(e) => setNewSection({ ...newSection, section_type: e.target.value })}
              className="w-full bg-surface-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
            >
              <option value="text">Texto / Markdown</option>
              <option value="html">HTML Customizado</option>
              <option value="comparison">Comparação</option>
              <option value="cta">Call to Action</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
              Título da Seção
            </label>
            <input
              type="text"
              value={newSection.title}
              onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
              placeholder="Ex: Recursos Exclusivos"
              className="w-full bg-surface-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
            Conteúdo
          </label>
          <textarea
            value={newSection.content}
            onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
            placeholder="Digite o conteúdo da seção..."
            rows={4}
            className="w-full bg-surface-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-white/20 focus:outline-none"
          />
          <p className="text-[10px] text-on-surface-variant mt-1">
            Dica: Suporta formatação em Markdown e tags de HTML básico.
          </p>
        </div>

        <button
          type="button"
          onClick={addSection}
          className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-semibold text-white transition-all"
        >
          <Plus size={14} /> Adicionar Seção
        </button>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white font-display">
          Seções Customizadas ({sections.length})
        </h3>

        {sections.length === 0 ? (
          <p className="text-xs text-on-surface-variant">Nenhuma seção customizada adicionada ainda.</p>
        ) : (
          sections.map((section, index) => (
            <div
              key={index}
              className={`border rounded-xl p-6 bg-white/5 transition-all ${
                section.is_active ? 'border-white/10' : 'border-white/5 opacity-55'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-1 items-center">
                  <button
                    type="button"
                    onClick={() => moveSection(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-white/10 rounded text-on-surface-variant disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <GripVertical className="w-4 h-4 text-on-surface-variant" />
                  <button
                    type="button"
                    onClick={() => moveSection(index, 'down')}
                    disabled={index === sections.length - 1}
                    className="p-1 hover:bg-white/10 rounded text-on-surface-variant disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-3 min-w-0">
                  {editingIndex === index ? (
                    <>
                      <input
                        type="text"
                        value={editContent.title}
                        onChange={(e) => setEditContent({ ...editContent, title: e.target.value })}
                        className="w-full bg-surface-high border border-white/10 rounded-xl px-4 py-2 text-sm text-white"
                      />
                      <textarea
                        value={editContent.content}
                        onChange={(e) => setEditContent({ ...editContent, content: e.target.value })}
                        rows={5}
                        className="w-full bg-surface-high border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(index)}
                          className="px-3 py-1 bg-primary text-white rounded text-xs font-semibold hover:bg-primary-high"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="px-3 py-1 bg-white/10 text-white rounded text-xs hover:bg-white/20"
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-bold text-white font-display truncate max-w-[200px] sm:max-w-md">
                          {section.title}
                        </h4>
                        <span className="px-2 py-0.5 bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold uppercase rounded-md">
                          {section.section_type}
                        </span>
                      </div>

                      <div className="bg-white/5 p-4 rounded-xl max-h-40 overflow-y-auto">
                        <pre className="text-xs text-on-surface-variant whitespace-pre-wrap font-sans leading-relaxed">
                          {section.content || 'Sem conteúdo'}
                        </pre>
                      </div>

                      <div className="flex items-center gap-4 pt-1">
                        <label className="flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
                          <input
                            type="checkbox"
                            checked={section.is_active}
                            onChange={() => toggleVisibility(index, section.is_active)}
                            className="rounded border-white/10 bg-surface-high focus:ring-primary"
                          />
                          Visível na Página
                        </label>

                        <button
                          type="button"
                          onClick={() => startEditing(index)}
                          className="ml-auto text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          Editar
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  className="p-1.5 text-red-400 hover:bg-red-500/10 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
