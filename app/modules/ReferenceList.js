import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { getFirestore, doc, getDoc, collection, getDocs } from '@firebase/firestore';
import { FIREBASE_APP, FIREBASE_AUTH } from '../../firebaseconfig';
import Recherche from './Recherche';

const memoize = (func) => {
  const cache = new Map();
  return async (...args) => {
    const key = args.join('-');
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = await func(...args);
    cache.set(key, result);
    return result;
  };
};

const Reference = {
  id: '',
  ref: '',
  stock: 0,
  stocknoncomplet: 0,
  Réservé: 0,
};

const ReferenceList = () => {
  const [references, setReferences] = useState([]);
  const [expandedReferences, setExpandedReferences] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  
  const fetchReferencesMemoized = memoize(async () => {
    const db = getFirestore(FIREBASE_APP);
    const user = FIREBASE_AUTH.currentUser;
    const userId = user.uid;
    const userDocRef = doc(db, 'Utilisateur', userId);
    const userDocSnapshot = await getDoc(userDocRef);
    const ville = userDocSnapshot.data().pays;
    const lieu = userDocSnapshot.data().entrepot;
    const referenceCollection = collection(db, 'Pays', ville, lieu+'Effectif');
    const querySnapshot = await getDocs(referenceCollection);
    const referenceData = [];
    querySnapshot.forEach((doc) => {
      referenceData.push({
        id: doc.id,
        ref: doc.data().ref,
        stock: doc.data().StockComplet,
        stocknoncomplet: doc.data().StockIncomplet,
        Réservé: doc.data().Réservé,
      });
    });
    referenceData.sort((a, b) => a.ref.localeCompare(b.ref));
    return referenceData;
  });

  useEffect(() => {
    const fetchReferences = async () => {
      // Utilisation de la version mémoisée de la fonction fetchReferences
      const referenceData = await fetchReferencesMemoized();
      setReferences(referenceData);
      setExpandedReferences(new Array(referenceData.length).fill(false));
    };

    fetchReferences();
  }, []);

  const handleReferencePress = (index) => {
    setExpandedReferences((prevState) => {
      const updatedExpandedReferences = [...prevState];
      updatedExpandedReferences[index] = !updatedExpandedReferences[index];
      return updatedExpandedReferences;
    });
  
    if (!expandedReferences[index]) {
      const reference = filteredAndSearchedReferences[index];
      const linkedReferences = references.filter((r) => r.ref.startsWith(reference.ref + '-') && r.ref !== reference.ref);
      if (linkedReferences.length > 0) {
        const minStock = linkedReferences.reduce((min, linkedRef) => {
          return linkedRef.stock < min ? linkedRef.stock : min;
        }, linkedReferences[0].stock);
      }
    }
  };
  

  const formatColumnValue = (value, columnWidth) => {
    const stringValue = String(value);
    const referenceParts = stringValue.split('-');
    const stringValue2 = referenceParts.length > 0 ? referenceParts[0].trim() : '';
    return stringValue2;
  };

  const formatColumnValueTitle = (value, columnWidth) => {
    const stringValue = String(value);
    const remainingSpaces = columnWidth - stringValue.length;
    const leftSpaces = Math.floor(remainingSpaces / 2);
    const rightSpaces = remainingSpaces - leftSpaces;
    const spaces = ' '.repeat(leftSpaces);
    const paddedValue = stringValue.padStart(leftSpaces + stringValue.length);
    return (
      <Text style={[styles.celltitle, { textAlign: 'center', width: columnWidth }]}>
        {spaces}
        {paddedValue}
        {spaces}
      </Text>
    );
  };

  const filteredReferences = references.reduce((acc, ref) => {
    const existingRef = acc.find((r) => formatColumnValue(r.ref, 24) === formatColumnValue(ref.ref, 24));
    if (!existingRef) {
      acc.push(ref);
    }
    return acc;
  }, []);

  const filteredAndSearchedReferences = filteredReferences.filter((ref) => {
    const referencePart = formatColumnValue(ref.ref, 24).toLowerCase();
    return referencePart.startsWith(searchValue.toLowerCase());
  });

  const handleSearchChange = (text) => {
    setSearchValue(text);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}></Text>
      <Text style={styles.title}>Inventaire</Text>
      <Recherche searchValue={searchValue} onSearchChange={handleSearchChange} />
      <Text style={styles.row}>{formatColumnValueTitle('Référence', 10)}</Text>
      <FlatList
        data={filteredAndSearchedReferences}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <TouchableOpacity onPress={() => handleReferencePress(index)}>
              <Text style={styles.cell}>{formatColumnValue(item.ref, 24)}</Text>
            </TouchableOpacity>
            {expandedReferences[index] && (
              <View style={styles.fullReferences}>
                {references
                  .filter((ref) => formatColumnValue(ref.ref, 24) === formatColumnValue(item.ref, 24))
                  .map((ref, i) => (
                    <View key={ref.id}>
                      <View style={[styles.fullReferences, styles.cell2]}>
                        <Text style={styles.row}>Référence : {ref.ref}</Text>
                        <Text>Stock complet : {ref.stock}</Text>
                        <Text>Stock non complet : {ref.stocknoncomplet}</Text>
                        <Text>Réservé : {ref.Réservé}</Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </View>
        )}
        
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  row: {
    marginBottom: 10,
    borderRadius: 104,
    fontWeight: 'bold',
  },
  cell: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#eee',
    textAlign: 'center',
    width: Dimensions.get('window').width - 20,
  },
  cell2: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#61c6dd',
    textAlign: 'center',
    width: Dimensions.get('window').width - 20,
    marginTop:3,
  },
  celltitle: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    textAlign: 'center',
    width: Dimensions.get('window').width - 20,
  },
  fullReferences: {
    marginTop: 5,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ReferenceList;