import React, { useState, useEffect, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { CustomDatePickerModal } from './CustomDatePickerModal';

interface DateRangeFilterProps {
  onSearch: (startDate: Date, endDate: Date) => void;
  defaultStartDate?: Date;
  defaultEndDate?: Date;
  isLoading?: boolean;
  children?: React.ReactNode;
}

// Obtener inicio del día actual
const getTodayStart = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Filtro de rango de fechas para ventas
 * Por defecto muestra solo el día de hoy
 */
export const DateRangeFilter: React.FC<DateRangeFilterProps> = memo(({
  onSearch,
  defaultStartDate,
  defaultEndDate,
  isLoading = false,
  children,
}) => {
  const themeColors = useThemeColors();

  const [startDate, setStartDate] = useState(defaultStartDate || getTodayStart());
  const [endDate, setEndDate] = useState(defaultEndDate || new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateType, setDateType] = useState<'start' | 'end'>('start');

  // Actualizar cuando cambian las props
  useEffect(() => {
    if (defaultStartDate) setStartDate(defaultStartDate);
    if (defaultEndDate) setEndDate(defaultEndDate);
  }, [defaultStartDate, defaultEndDate]);

  const formatDateDisplay = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleSearch = () => {
    if (startDate > endDate) {
      return;
    }
    onSearch(startDate, endDate);
  };

  const openDatePicker = (type: 'start' | 'end') => {
    setDateType(type);
    setDatePickerOpen(true);
  };

  const handleConfirmDate = (selectedDate: Date) => {
    setDatePickerOpen(false);
    if (dateType === 'start') {
      setStartDate(selectedDate);
    } else {
      setEndDate(selectedDate);
    }
  };

  const TURQUOISE = '#00bdce'; // Color from design

  return (
    <View style={styles.container}>
      <View style={styles.dateRow}>
        {/* Fecha desde */}
        <View style={styles.dateColumn}>
          <Text style={[styles.label, { color: TURQUOISE }]}>Fecha desde</Text>
          <TouchableOpacity
            style={[
              styles.dateButton,
              {
                borderColor: TURQUOISE,
                backgroundColor: themeColors.background
              }
            ]}
            onPress={() => openDatePicker('start')}>
            <Text style={{ color: themeColors.text || '#000' }}>{formatDateDisplay(startDate)}</Text>
          </TouchableOpacity>
        </View>

        {/* Fecha hasta */}
        <View style={styles.dateColumn}>
          <Text style={[styles.label, { color: TURQUOISE }]}>Fecha hasta</Text>
          <TouchableOpacity
            style={[
              styles.dateButton,
              {
                borderColor: TURQUOISE,
                backgroundColor: themeColors.background
              }
            ]}
            onPress={() => openDatePicker('end')}>
            <Text style={{ color: themeColors.text || '#000' }}>{formatDateDisplay(endDate)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros adicionales */}
      {children}

      {/* Botón buscar */}
      <TouchableOpacity
        style={[styles.searchButton, { backgroundColor: TURQUOISE }]}
        onPress={handleSearch}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.searchButtonText}>BUSCAR</Text>
        )}
      </TouchableOpacity>

      {/* Modal selector de fecha */}
      <CustomDatePickerModal
        visible={datePickerOpen}
        date={dateType === 'start' ? startDate : endDate}
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerOpen(false)}
        title={dateType === 'start' ? 'Fecha desde' : 'Fecha hasta'}
        mode="date"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    marginTop: 10,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  dateColumn: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'left',
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  searchButton: {
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
