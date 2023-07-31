import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ReferenceList from '../modules/ReferenceList'; // Import du composant ReferenceList
import QRCodeScannerSortie from '../modules/QRCodeScannerSortie';
import PageLogout from '../modules/PageLogout';
import ExcelFilesButton_csv from '../modules/ExcelFilesButtonCSV';
import ListeLivraisonsScreenCSV from '../modules/ListeLivraisonScreenCSV';

type Page = 'A' | 'B' | 'H' | 'F' | 'G' | 'D';

const HomeScreen: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('A');
  const navigation = useNavigation();
  

  const changePage = (page: Page) => {
    setCurrentPage(page);
  };

 /* const renderPage = () => {
    switch (currentPage) {
      case 'A':
        return (
          <View style={styles.pageContainer}>
            <View style={styles.pageContainer}>
              <ReferenceList />
            </View>
          </View>
        );
      case 'B':
        return (
          <View style={styles.pageContainer}>
            <Text style={styles.title}>Page B</Text>
            <Text>Contenu de la page B</Text>
          </View>
        );
      case 'H':
        return (
           <View style={styles.pageContainer}>
            <Text style={styles.title}>Arrivées</Text>
            <ListeLivraisonsScreenCSV/>
            <ExcelFilesButton_csv/>
          </View>
        );
      case 'G':
        return (
          <View style={styles.pageContainer}>
            <QRCodeScannerSortie />
          </View>
        );
      case 'D':
        return (
          <View style={styles.pageContainer}>
            <Text style={styles.title}></Text>
            <PageLogout/>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderPage()}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={() => changePage('A')} style={styles.button}>
          <Image source={require('../../assets/warehouse_2.png')} style={styles.buttonImage} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changePage('H') }  style={styles.button}>
          <Image source={require('../../assets/truck_2.png')} style={styles.buttonImage} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changePage('G')} style={styles.button}>
          <Image source={require('../../assets/qrcode.png')} style={styles.buttonImage} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changePage('D') }  style={styles.button}>
          <Image source={require('../../assets/logout.png')} style={styles.buttonImage} />
        </TouchableOpacity>
      </View>
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
  pageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40, // Add margin to move the title down
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: 'lightgray',
    padding: 10,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlignVertical: 'center',
    alignItems: 'center',
  },
  buttonImage: {
    width: 50,
    height: 50,
  },
}); */

const renderPage = () => {
  switch (currentPage) {
    case 'A':
      return (
        <View >
          <View>
            <ReferenceList />
          </View>
        </View>
      );
  }}
return (
  <View>
    {renderPage()}
    <View>
      <TouchableOpacity onPress={() => changePage('A')} >
        <Image source={require('../../assets/warehouse_2.png')} />
      </TouchableOpacity>
      </View>
    </View>
      );
} 

export default HomeScreen;