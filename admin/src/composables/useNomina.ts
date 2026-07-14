import { ref } from 'vue';
import { authFetch } from '@/utils/api';

export interface NominaRegistro {
    id: number;
    usuario_id: number;
    usuario: string;
    rol: string;
    hora_entrada: string;
    hora_salida: string;
    fecha: string;
    estadoChecado: 'pendiente' | 'puntual' | 'retardo' | 'regreso' | 'falta';
    horaExacta: string | null;
    horaExactaSalida: string | null;
}

export interface NominaSemanaRegistro {
    id: number;
    usuario_id: number;
    rol: string;
    hora_entrada: string;
    hora_salida: string;
    fecha: string;
}

export interface DiaSemana {
    dia_semana: number; // 0=Lun, 1=Mar, ..., 6=Dom
    tipo: 'laboral' | 'descanso';
    pagado?: boolean;
    hora_entrada: string | null;
    hora_salida: string | null;
}

export function useNomina() {
    const nominas = ref<NominaRegistro[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    /**
     * Obtiene todos los registros de nómina para una fecha específica (YYYY-MM-DD).
     */
    const fetchNominas = async (fecha: string) => {
        loading.value = true;
        error.value = null;
        try {
            const res = await authFetch(`/api/nomina?fecha=${fecha}`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al obtener la nómina');
            }
            nominas.value = await res.json();
        } catch (err: any) {
            error.value = err.message;
            console.error('useNomina.fetchNominas:', error.value);
        } finally {
            loading.value = false;
        }
    };

    /**
     * Obtiene los registros de nómina de un usuario en el rango de una semana.
     */
    const getNominaSemana = async (usuarioId: number, semanaInicio: string): Promise<NominaSemanaRegistro[]> => {
        try {
            const res = await authFetch(`/api/nomina/semana?usuario_id=${usuarioId}&semana_inicio=${semanaInicio}`);
            if (!res.ok) return [];
            return await res.json();
        } catch {
            return [];
        }
    };

    /**
     * Upsert de registros de nómina para una semana completa.
     */
    const updateNominaSemana = async (
        usuarioId: number,
        rol: string,
        registros: { fecha: string; hora_entrada: string; hora_salida: string }[]
    ) => {
        try {
            const res = await authFetch('/api/nomina/semana', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: usuarioId, rol, registros }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al actualizar la nómina');
            }
            const data = await res.json();
            return { success: true, data };
        } catch (err: any) {
            console.error('useNomina.updateNominaSemana:', err);
            return { success: false, error: err.message };
        }
    };

    /**
     * Crea uno o múltiples registros de nómina.
     */
    const createNomina = async (
        payload: { usuario_id: number; rol: string; hora_entrada: string; hora_salida: string; fecha: string }[]
    ) => {
        try {
            const res = await authFetch('/api/nomina', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al guardar la nómina');
            }
            const data = await res.json();
            return { success: true, data };
        } catch (err: any) {
            console.error('useNomina.createNomina:', err);
            return { success: false, error: err.message };
        }
    };

    /**
     * Obtiene el horario semanal plantilla de un usuario.
     */
    const getHorarioSemanal = async (usuarioId: number): Promise<DiaSemana[]> => {
        try {
            const res = await authFetch(`/api/horarios-semanales/${usuarioId}`);
            if (!res.ok) return [];
            return await res.json();
        } catch {
            return [];
        }
    };

    /**
     * Guarda (reemplaza) el horario semanal completo de un usuario.
     */
    const saveHorarioSemanal = async (usuarioId: number, dias: DiaSemana[]) => {
        try {
            const res = await authFetch(`/api/horarios-semanales/${usuarioId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dias }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al guardar el horario semanal');
            }
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    /**
     * Obtiene el corte quincenal de un usuario.
     */
    const getCorteQuincenal = async (usuarioId: number, fechaInicio: string, fechaFin: string) => {
        try {
            const res = await authFetch(`/api/nomina/corte-quincenal?usuario_id=${usuarioId}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al obtener el corte quincenal');
            }
            return await res.json();
        } catch (err: any) {
            console.error('useNomina.getCorteQuincenal:', err);
            return { error: err.message };
        }
    };

    return {
        nominas,
        loading,
        error,
        fetchNominas,
        getNominaSemana,
        updateNominaSemana,
        createNomina,
        getHorarioSemanal,
        saveHorarioSemanal,
        getCorteQuincenal,
    };
}
