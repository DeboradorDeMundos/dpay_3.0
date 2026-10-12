import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AppModal from '../base/AppModal';
import { Input } from '../base/Input';
import { createQuickProduct } from '../../services/api';

interface CreateQuickProductModalProps {
  visible: boolean;
  codigo: string;
  idMoneda?: number;
  onClose: () => void;
  onCreated: (product: any) => void;
}

export const CreateQuickProductModal: React.FC<CreateQuickProductModalProps> = ({
  visible,
  codigo,
  idMoneda,
  onClose,
  onCreated,
}) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setNombre('');
      setDescripcion('');
      setPrecio('');
      setErrors({});
      setSubmitError('');
    }
  }, [visible, codigo]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!nombre.trim() || nombre.trim().length < 2) {
      next.nombre = 'Nombre requerido (mínimo 2 caracteres)';
    }
    if (!descripcion.trim() || descripcion.trim().length < 3) {
      next.descripcion = 'Descripción requerida (mínimo 3 caracteres)';
    }
    const precioNum = parseFloat(precio.replace(',', '.'));
    if (!precio.trim() || Number.isNaN(precioNum) || precioNum <= 0) {
      next.precio = 'Ingrese un precio válido mayor a 0';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const precioNum = parseFloat(precio.replace(',', '.'));
      const product = await createQuickProduct({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: precioNum,
        ...(idMoneda ? { id_moneda: idMoneda } : {}),
      });
      onCreated(product);
    } catch (err: any) {
      setSubmitError(err?.message || 'No se pudo crear el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      visible={visible}
      title="Crear producto"
      onClose={loading ? undefined : onClose}
      maxWidth={420}
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Input label="Código" value={codigo} editable={false} />
          <Input
            label="Nombre producto *"
            value={nombre}
            onChangeText={(v) => {
              setNombre(v);
              if (errors.nombre) setErrors((e) => ({ ...e, nombre: '' }));
            }}
            placeholder="Nombre del producto"
            error={errors.nombre}
            editable={!loading}
            maxLength={80}
          />
          <Input
            label="Descripción *"
            value={descripcion}
            onChangeText={(v) => {
              setDescripcion(v);
              if (errors.descripcion) setErrors((e) => ({ ...e, descripcion: '' }));
            }}
            placeholder="Descripción del producto"
            error={errors.descripcion}
            editable={!loading}
            multiline
            numberOfLines={3}
            maxLength={300}
          />
          <Input
            label="Precio venta *"
            value={precio}
            onChangeText={(v) => {
              setPrecio(v.replace(/[^0-9.,]/g, ''));
              if (errors.precio) setErrors((e) => ({ ...e, precio: '' }));
            }}
            placeholder="0"
            keyboardType="decimal-pad"
            error={errors.precio}
            editable={!loading}
          />
          <Text style={styles.hint}>
            Marca, categoría, unidad y otros datos se pueden editar después en el portal DTemite.
          </Text>
          {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.btnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.btnPrimaryText}>Guardar y agregar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  scroll: { maxHeight: 420 },
  form: { gap: 4 },
  hint: {
    color: '#8899AA',
    fontSize: 12,
    fontFamily: 'Montserrat-Bold_0',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 8,
  },
  error: {
    color: '#FF6B6B',
    fontSize: 13,
    fontFamily: 'Montserrat-Bold_0',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: '#03C0C3' },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#03C0C3',
  },
  btnDisabled: { opacity: 0.7 },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Montserrat-Bold_0',
  },
  btnSecondaryText: {
    color: '#03C0C3',
    fontSize: 14,
    fontFamily: 'Montserrat-Bold_0',
  },
});
