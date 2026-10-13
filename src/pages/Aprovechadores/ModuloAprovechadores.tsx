import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  type Aprovechador,
  createAprovechador,
  deleteAprovechador,
  getAprovechadores,
  setEstadoAprovechador,
  updateAprovechador,
} from '../../api/aprovechadores';
import { confirmar } from '../../utils/confirmar';

const vacio: Aprovechador = { nit: '', nombre: '' };

const mensajeError = (error: any, porDefecto: string) => error?.response?.data?.error || porDefecto;

export default function ModuloAprovechadores() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Aprovechador>(vacio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [filtro, setFiltro] = useState('');

  const { data: aprovechadores = [], isLoading } = useQuery({
    queryKey: ['aprovechadores-catalogo'],
    queryFn: getAprovechadores,
  });

  const refrescar = () => {
    queryClient.invalidateQueries({ queryKey: ['aprovechadores-catalogo'] });
    queryClient.invalidateQueries({ queryKey: ['aprovechadores'] }); // lista de asignación
  };

  const limpiar = () => {
    setForm(vacio);
    setEditandoId(null);
  };

  const guardar = useMutation({
    mutationFn: (datos: Aprovechador) =>
      editandoId ? updateAprovechador(editandoId, datos) : createAprovechador(datos),
    onSuccess: (a) => {
      toast.success(editandoId ? `Aprovechador ${a.nombre} actualizado.` : `Aprovechador ${a.nombre} creado.`);
      limpiar();
      refrescar();
    },
    onError: (e) => toast.error(mensajeError(e, 'No se pudo guardar el aprovechador.')),
  });

  const cambiarEstado = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => setEstadoAprovechador(id, activo),
    onSuccess: (a) => {
      toast.success(a.activo ? `${a.nombre} activado.` : `${a.nombre} desactivado.`);
      refrescar();
    },
    onError: (e) => toast.error(mensajeError(e, 'No se pudo cambiar el estado.')),
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => deleteAprovechador(id),
    onSuccess: () => {
      toast.success('Aprovechador eliminado.');
      if (editandoId) limpiar();
      refrescar();
    },
    onError: (e) => toast.error(mensajeError(e, 'No se pudo eliminar.')),
  });

  const filtrados = useMemo(() => {
    const t = filtro.trim().toLowerCase();
    if (!t) return aprovechadores;
    return aprovechadores.filter(
      (a) => a.nit.toLowerCase().includes(t) || a.nombre.toLowerCase().includes(t) || String(a.id) === t
    );
  }, [aprovechadores, filtro]);

  const activos = aprovechadores.filter((a) => a.activo).length;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nit.trim() || !form.nombre.trim()) {
      toast.error('NIT y nombre son obligatorios.');
      return;
    }
    guardar.mutate({ nit: form.nit.trim(), nombre: form.nombre.trim() });
  };

  const editar = (a: Aprovechador) => {
    setEditandoId(a.id!);
    setForm({ nit: a.nit, nombre: a.nombre });
  };

  const confirmarEliminar = async (a: Aprovechador) => {
    if (await confirmar({
      titulo: `¿Eliminar definitivamente a ${a.nombre}?`,
      detalle: 'Solo es posible si nunca se ha usado.',
      textoConfirmar: 'Eliminar',
      peligroso: true,
    })) {
      eliminar.mutate(a.id!);
    }
  };

  return (
    <div className="max-w-7xl">
      <div className="page-header">
        <div>
          <p className="page-kicker">Parametrización</p>
          <h1 className="page-title">Aprovechadores</h1>
          <p className="page-subtitle">
            Asociaciones que se vinculan a las tarifas. Solo los activos aparecen al asignar.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="kpi min-w-36">
            <p className="kpi-label">Registrados</p>
            <p className="kpi-value">{aprovechadores.length}</p>
          </div>
          <div className="kpi min-w-36 border-l-verde-500">
            <p className="kpi-label">Activos</p>
            <p className="kpi-value">{activos}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[20rem_1fr] gap-6 items-start">
        {/* Formulario */}
        <form onSubmit={onSubmit} className="card max-w-xl 2xl:max-w-none">
          <div className="card-header">
            <h2 className="text-base font-semibold">{editandoId ? `Editar aprovechador #${editandoId}` : 'Nuevo aprovechador'}</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label" htmlFor="nit">NIT</label>
              <input
                id="nit"
                className="input font-mono"
                placeholder="900123456-7"
                maxLength={20}
                value={form.nit}
                onChange={(e) => setForm({ ...form, nit: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="nombre">Nombre o razón social</label>
              <input
                id="nombre"
                className="input"
                placeholder="Asociación de recicladores..."
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1" disabled={guardar.isPending}>
                {guardar.isPending && <span className="spinner" />}
                {editandoId ? 'Guardar cambios' : 'Registrar'}
              </button>
              {editandoId && (
                <button type="button" className="btn-secondary" onClick={limpiar}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Listado */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="text-base font-semibold">Catálogo</h2>
            <input
              className="input max-w-64 py-2"
              placeholder="Buscar por id, NIT o nombre"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="w-16">Id</th>
                  <th className="w-40">NIT</th>
                  <th>Nombre</th>
                  <th className="w-28">Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      <span className="spinner mr-2" /> Cargando...
                    </td>
                  </tr>
                ) : filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      {aprovechadores.length === 0 ? 'Aún no hay aprovechadores registrados.' : 'Sin coincidencias.'}
                    </td>
                  </tr>
                ) : (
                  filtrados.map((a) => (
                    <tr key={a.id} className={editandoId === a.id ? 'bg-verde-50' : ''}>
                      <td className="font-mono text-slate-400">{a.id}</td>
                      <td className="font-mono whitespace-nowrap">{a.nit}</td>
                      <td className="font-semibold text-petroleo-900">{a.nombre}</td>
                      <td>
                        <span className={a.activo ? 'badge-ok' : 'badge-off'}>{a.activo ? 'Activo' : 'Inactivo'}</span>
                      </td>
                      <td className="text-right whitespace-nowrap space-x-3">
                        <button className="btn-link" onClick={() => editar(a)}>
                          Editar
                        </button>
                        <button
                          className="btn-link"
                          disabled={cambiarEstado.isPending}
                          onClick={() => cambiarEstado.mutate({ id: a.id!, activo: !a.activo })}
                        >
                          {a.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          className="btn-link text-red-600 hover:text-red-700"
                          disabled={eliminar.isPending}
                          onClick={() => confirmarEliminar(a)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
