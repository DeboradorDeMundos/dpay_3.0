import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, BackHandler } from 'react-native';
import AppModal from '../base/AppModal';
import { typography } from '../../theme';
import { useThemeColors } from '../../hooks/useThemeColors';
import { APP_VERSION, APP_VERSION_CODE } from '../../constants/appVersion';
import { useAppUpdateStore } from '../../stores/appUpdateStore';

export const AppUpdateModal: React.FC = () => {
  const themeColors = useThemeColors();
  const visible = useAppUpdateStore((s) => s.visible);
  const forceUpdate = useAppUpdateStore((s) => s.forceUpdate);
  const message = useAppUpdateStore((s) => s.message);
  const latestVersion = useAppUpdateStore((s) => s.latestVersion);
  const openingStore = useAppUpdateStore((s) => s.openingStore);
  const dismissSoft = useAppUpdateStore((s) => s.dismissSoft);
  const openDownload = useAppUpdateStore((s) => s.openDownload);

  useEffect(() => {
    if (!visible || !forceUpdate) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [visible, forceUpdate]);

  const buttons = useMemo(() => {
    const updateBtn = {
      text: 'Actualizar',
      onPress: () => {
        openDownload();
      },
      variant: 'secondary' as const,
      loading: openingStore,
      disabled: openingStore,
    };

    if (forceUpdate) {
      return [updateBtn];
    }

    return [
      {
        text: 'Más tarde',
        onPress: dismissSoft,
        variant: 'primary' as const,
        disabled: openingStore,
      },
      updateBtn,
    ];
  }, [forceUpdate, openingStore, dismissSoft, openDownload]);

  return (
    <AppModal
      visible={visible}
      title={forceUpdate ? 'Actualización requerida' : 'Nueva versión disponible'}
      message={message}
      buttons={buttons}
      onClose={forceUpdate ? undefined : dismissSoft}
    >
      <View style={styles.details}>
        <Text style={[styles.meta, { color: themeColors.textSecondary }]}>
          Tu versión: {APP_VERSION} ({APP_VERSION_CODE})
          {latestVersion ? ` · Disponible: ${latestVersion}` : ''}
        </Text>
        <Text style={[styles.hint, { color: themeColors.textSecondary }]}>
          Te llevaremos a la tienda TUU en el detalle de D-PAY para actualizar.
        </Text>
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  details: {
    marginBottom: 24,
    gap: 8,
  },
  meta: {
    fontFamily: typography.families.normal,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  hint: {
    fontFamily: typography.families.normal,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.9,
  },
});
