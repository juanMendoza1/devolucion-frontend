import toast from 'react-hot-toast';

interface OpcionesConfirmacion {
  titulo: string;
  detalle?: string;
  textoConfirmar?: string;
  peligroso?: boolean;
}

/**
 * Confirmación en forma de notificación (reemplaza window.confirm / alert).
 * Devuelve true si el usuario confirma, false si cancela.
 */
export function confirmar({ titulo, detalle, textoConfirmar = 'Confirmar', peligroso = false }: OpcionesConfirmacion): Promise<boolean> {
  return new Promise((resolve) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2 max-w-sm">
          <p className="font-semibold text-sm text-petroleo-900">{titulo}</p>
          {detalle && <p className="text-xs text-slate-500">{detalle}</p>}
          <div className="flex gap-2 mt-2">
            <button
              className={`${peligroso ? 'btn-danger' : 'btn-primary'} btn-sm`}
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
            >
              {textoConfirmar}
            </button>
            <button
              className="btn-secondary btn-sm"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: 'top-center' }
    );
  });
}
