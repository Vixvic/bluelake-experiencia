import React, { useState, useEffect } from 'react';
import { X, CalendarDays, Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Tour {
    id: string;
    title_es: string;
    price: number | null;
}

interface ManualBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ManualBookingModal: React.FC<ManualBookingModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [tours, setTours] = useState<Tour[]>([]);

    const [formData, setFormData] = useState({
        tour_id: '',
        date: '',
        adults: 1,
        children: 0,
        total_amount: 0,
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        document_type: 'DNI',
        document_number: '',
        payment_method: 'transfer',
        payment_mode: 'full',
        status: 'confirmed',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            supabase.from('tours').select('id, title_es, price').eq('is_active', true).then(({ data }) => {
                if (data) setTours(data);
            });
        }
    }, [isOpen]);

    // Calcular precio sugerido al cambiar tour, adultos o niños
    useEffect(() => {
        if (!formData.tour_id) return;
        const selectedTour = tours.find(t => t.id === formData.tour_id);
        if (selectedTour?.price) {
            const calculated = (formData.adults * selectedTour.price) + (formData.children * (selectedTour.price * 0.7));
            setFormData(prev => ({ ...prev, total_amount: Number(calculated.toFixed(2)) }));
        }
    }, [formData.tour_id, formData.adults, formData.children, tours]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: authData } = await supabase.auth.getUser();
            if (!authData?.user) throw new Error("No estás autenticado como administrador");

            const insertData = {
                tour_id: formData.tour_id,
                user_id: authData.user.id, // Lo vinculamos al admin que lo crea
                dates: [formData.date],
                adults: Number(formData.adults),
                children: Number(formData.children),
                total_amount: Number(formData.total_amount),
                customer_name: formData.customer_name,
                customer_email: formData.customer_email || 'correo@pendiente.com', // fallback si no dan email
                customer_phone: formData.customer_phone,
                document_type: formData.document_type,
                document_number: formData.document_number,
                payment_method: formData.payment_method,
                payment_mode: formData.payment_mode,
                status: formData.status,
                notes: `[Reserva Manual Admin] ${formData.notes}`
            };

            const { error } = await supabase.from('bookings').insert(insertData);

            if (error) throw error;

            toast({
                title: "Reserva Creada",
                description: "La reserva manual ha sido registrada exitosamente.",
            });
            onSuccess();
        } catch (error: any) {
            console.error('Error al crear reserva manual:', error);
            toast({
                variant: 'destructive',
                title: "Error al crear",
                description: error.message || "No se pudo registrar la reserva. Revisa los datos.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl my-8 relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-primary" />
                        Nueva Reserva Manual
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Registra una reserva externa (pasajeros en agencia, contactos directos, etc.)</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Sección 1: Tour y Fecha */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold mb-1 block">Tour / Experiencia *</label>
                            <select
                                name="tour_id"
                                required
                                value={formData.tour_id}
                                onChange={handleChange}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                            >
                                <option value="">Selecciona un tour</option>
                                {tours.map(t => (
                                    <option key={t.id} value={t.id}>{t.title_es}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-semibold mb-1 block">Fecha Principal *</label>
                            <Input
                                type="date"
                                name="date"
                                required
                                value={formData.date}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Sección 2: Info del Pasajero */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-border bg-muted/20">
                        <div className="md:col-span-2">
                            <h3 className="text-sm font-bold text-foreground mb-3">Datos del Titular</h3>
                        </div>
                        <div>
                            <label className="text-xs font-semibold mb-1 block">Nombre Completo *</label>
                            <Input name="customer_name" required value={formData.customer_name} onChange={handleChange} placeholder="Ej: Juan Pérez" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold mb-1 block">Teléfono / WhatsApp *</label>
                            <Input name="customer_phone" required value={formData.customer_phone} onChange={handleChange} placeholder="Ej: 999888777" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold mb-1 block">Tipo de Documento</label>
                            <select name="document_type" value={formData.document_type} onChange={handleChange} className="w-full h-10 px-3 rounded-md border border-input bg-background">
                                <option value="DNI">DNI</option>
                                <option value="CE">CE</option>
                                <option value="Pasaporte">Pasaporte</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold mb-1 block">Número de Documento *</label>
                            <Input name="document_number" required value={formData.document_number} onChange={handleChange} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold mb-1 block">Email (Opcional)</label>
                            <Input type="email" name="customer_email" value={formData.customer_email} onChange={handleChange} placeholder="correo@ejemplo.com" />
                        </div>
                    </div>

                    {/* Sección 3: Participantes y Cobros */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs font-semibold mb-1 block">Adultos</label>
                            <Input type="number" min="1" name="adults" required value={formData.adults} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold mb-1 block">Niños</label>
                            <Input type="number" min="0" name="children" required value={formData.children} onChange={handleChange} />
                        </div>
                        <div className="col-span-2 border-l border-border pl-4">
                            <label className="text-xs font-semibold mb-1 block text-primary">Monto Total a Cobrar (S/) *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">S/</span>
                                <Input type="number" step="0.01" min="0" name="total_amount" required value={formData.total_amount} onChange={handleChange} className="pl-9 font-bold text-lg text-primary" />
                            </div>
                        </div>
                    </div>

                    {/* Sección 4: Método y Estado */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-semibold mb-1 block">Modo de Pago</label>
                            <select name="payment_mode" value={formData.payment_mode} onChange={handleChange} className="w-full h-10 px-3 rounded-md border border-input bg-background">
                                <option value="full">Pago Completo</option>
                                <option value="partial">Abono / Parcial</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold mb-1 block">Método</label>
                            <select name="payment_method" value={formData.payment_method} onChange={handleChange} className="w-full h-10 px-3 rounded-md border border-input bg-background">
                                <option value="transfer">Transferencia</option>
                                <option value="yape">Yape</option>
                                <option value="plin">Plin</option>
                                <option value="card">Tarjeta</option>
                                <option value="cash">Efectivo 💵</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold mb-1 block">Estado Inicial</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full h-10 px-3 rounded-md border border-input bg-background">
                                <option value="confirmed">Confirmado (Pagado)</option>
                                <option value="pending">Pendiente</option>
                            </select>
                        </div>
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="text-xs font-semibold mb-1 block">Notas / Origen de Reserva (Opcional)</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Ej: Cliente vino a oficina física..."
                            className="w-full p-3 rounded-md border border-input bg-background text-sm"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="min-w-[140px] gap-2">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Crear Reserva
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManualBookingModal;
