import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';

interface RechercheProps extends TextInputProps {
  searchValue: string;
  onSearchChange: (text: string) => void;
}

const Recherche: React.FC<RechercheProps> = ({ searchValue, onSearchChange }) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Rechercher par référence"
        value={searchValue}
        onChangeText={onSearchChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});

export default Recherche;
