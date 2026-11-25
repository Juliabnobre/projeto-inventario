import React, { useState } from 'react';

import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  Keyboard
} from 'react-native';

import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';

export default function App() {



  const [tela, setTela] = useState('principal');


  const [equipamento, setEquipamento] = useState('');
  const [sala, setSala] = useState('');
  const [status, setStatus] = useState('Em Operação');
  const [observacoes, setObservacoes] = useState('');



  const [permission, requestPermission] = useCameraPermissions();
  const [scaneando, setScaneando] = useState(false);

 

  const [inventario, setInventario] = useState([
    {
      id: '1',
      nome: 'Computador Core i5 16GB',
      pat: 'ETECGRU-00001',
      local: 'Laboratório 1',
      estatus: 'Em Operação',
      latitude: null,
      longitude: null,
      dataCadastro: null,
      observacoes: ''
    },
    {
      id: '2',
      nome: 'Roteador Cisco Linha 7609',
      pat: 'ETECGRU-00002',
      local: 'Laboratório 2',
      estatus: 'Em Operação',
      latitude: null,
      longitude: null,
      dataCadastro: null,
      observacoes: ''
    }
  ]);


  const obterDataAtual = () => {
    const hoje = new Date();

    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();

    return `${dia}/${mes}/${ano}`;
  };



  const gerarPatrimonio = () => {

    const numeros = inventario.map(item => {
      return parseInt(
        item.pat.replace('ETECGRU-', ''),
        10
      ) || 0;
    });

    const proximoNumero =
      Math.max(0, ...numeros) + 1;

    return `ETECGRU-${String(proximoNumero).padStart(5, '0')}`;
  };



  const adicionarAoInventario = async () => {

    Keyboard.dismiss();

    if (
      equipamento.trim() === '' ||
      sala.trim() === ''
    ) {
      Alert.alert(
        'Campos obrigatórios',
        'Preencha a descrição do equipamento e o laboratório/sala.'
      );
      return;
    }

    if (
      status === 'Em Manutenção' &&
      observacoes.trim() === ''
    ) {
      Alert.alert(
        'Observação necessária',
        'Descreva o problema ou a manutenção necessária.'
      );
      return;
    }


    let latitude = null;
    let longitude = null;

    try {

      const permissao =
        await Location.requestForegroundPermissionsAsync();

      if (permissao.status === 'granted') {

        const localizacao =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced
          });

        latitude = localizacao.coords.latitude;
        longitude = localizacao.coords.longitude;

      } else {

        Alert.alert(
          'Localização não autorizada',
          'O equipamento será cadastrado sem as coordenadas GPS.'
        );
      }

    } catch (erro) {

      console.log('Erro ao obter localização:', erro);

      Alert.alert(
        'Aviso',
        'Não foi possível obter a localização. O cadastro continuará sem GPS.'
      );
    }

  

    const patrimonio = gerarPatrimonio();

    const novoItem = {

      id: Date.now().toString(),

      nome: equipamento.trim(),

      pat: patrimonio,

      local: sala.trim(),

      estatus: status,

      latitude: latitude,

      longitude: longitude,

      dataCadastro: obterDataAtual(),

      observacoes:
        status === 'Em Manutenção'
          ? observacoes.trim()
          : ''

    };

    

    setInventario(listaAtual => [
      ...listaAtual,
      novoItem
    ]);

   

    setEquipamento('');
    setSala('');
    setStatus('Em Operação');
    setObservacoes('');

   

    Alert.alert(
      'Cadastro realizado!',
      `Equipamento cadastrado com sucesso!\n\n` +
      `Patrimônio: ${patrimonio}\n` +
      `Status: ${status}\n` +
      `Data: ${novoItem.dataCadastro}`
    );

  };

 

  const lidarComQrCodeEscaneado = ({ data }) => {

    setScaneando(false);

    const itemEncontrado = inventario.find(
      item =>
        item.pat === data.toUpperCase().trim()
    );

    if (itemEncontrado) {

      Alert.alert(
        'Equipamento Encontrado!',

        `Patrimônio: ${itemEncontrado.pat}\n\n` +

        `Equipamento: ${itemEncontrado.nome}\n\n` +

        `Local: ${itemEncontrado.local}\n\n` +

        `Status: ${itemEncontrado.estatus}\n\n` +

        `Cadastrado em: ${itemEncontrado.dataCadastro || 'Não registrada'}\n\n` +

        `Observações: ${itemEncontrado.observacoes || 'Nenhuma'}\n\n` +

        `Latitude: ${
          itemEncontrado.latitude !== null
            ? itemEncontrado.latitude.toFixed(6)
            : 'Não registrada'
        }\n` +

        `Longitude: ${
          itemEncontrado.longitude !== null
            ? itemEncontrado.longitude.toFixed(6)
            : 'Não registrada'
        }`
      );

    } else {

      Alert.alert(
        'Não Encontrado',
        `O patrimônio ${data} não foi encontrado no inventário.`
      );
    }

  };


  const iniciarScanner = async () => {

    try {

      if (!permission || !permission.granted) {

        const resposta = await requestPermission();

        if (!resposta.granted) {

          Alert.alert(
            'Permissão negada',
            'É necessário permitir o acesso à câmera.'
          );

          return;
        }
      }

      setScaneando(true);

    } catch (erro) {

      Alert.alert(
        'Erro',
        'Não foi possível acessar a câmera.'
      );

      console.log(erro);
    }
  };


  const renderizarStatus = () => {

    const opcoes = [
      {
        valor: 'Em Operação',
        estilo: styles.statusOperacao
      },
      {
        valor: 'Em Manutenção',
        estilo: styles.statusManutencao
      },
      {
        valor: 'Em Estoque',
        estilo: styles.statusEstoque
      }
    ];

    return (

      <View style={styles.campoStatus}>

        <Text style={styles.label}>
          Status do Equipamento
        </Text>

        <View style={styles.opcoesStatus}>

          {opcoes.map(opcao => {

            const selecionado =
              status === opcao.valor;

            return (

              <TouchableOpacity
                key={opcao.valor}
                style={[
                  styles.botaoStatus,
                  selecionado && opcao.estilo
                ]}
                onPress={() => {

                  setStatus(opcao.valor);

                  if (opcao.valor !== 'Em Manutenção') {
                    setObservacoes('');
                  }

                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{
                  selected: selecionado
                }}
              >

                <Text style={[
                  styles.textoStatus,
                  selecionado && styles.textoStatusSelecionado
                ]}>
                  {opcao.valor}
                </Text>

                {selecionado && (
                  <Text style={styles.checkStatus}>
                    ✓
                  </Text>
                )}

              </TouchableOpacity>

            );

          })}

        </View>

      </View>

    );
  };


  if (scaneando) {

    return (

      <View style={styles.containerCamera}>

        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={lidarComQrCodeEscaneado}
          barcodeScannerSettings={{
            barcodeTypes: ['qr']
          }}
        />

        <View style={styles.overlayCamera}>

          <Text style={styles.textoInstrucaoCamera}>
            Aponte para o QR Code do Patrimônio
          </Text>

          <TouchableOpacity
            style={styles.botaoFecharCamera}
            onPress={() => setScaneando(false)}
          >
            <Text style={styles.textoBotao}>
              Cancelar
            </Text>
          </TouchableOpacity>

        </View>

      </View>

    );
  }


  if (tela === 'relatorios') {

    return (

      <SafeAreaView style={styles.container}>

        <View style={styles.header}>

          <Text style={styles.tituloHeader}>
            Relatórios
          </Text>

        </View>

        <Text style={styles.subtitulo}>
          Equipamentos Cadastrados
        </Text>

        <Text style={styles.total}>
          Total: {inventario.length} equipamentos
        </Text>

        <FlatList
          data={inventario}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (

            <View style={styles.cardEquipamento}>

              <View style={styles.infoHardware}>

                <Text style={styles.nomeCard}>
                  {item.nome}
                </Text>

                <Text style={styles.patrimonioCard}>
                  Patrimônio: {item.pat}
                </Text>

                <Text style={styles.localCard}>
                  Sala: {item.local}
                </Text>

                <Text style={[
                  styles.estatusCard,
                  item.estatus === 'Em Manutenção' && styles.textoManutencao,
                  item.estatus === 'Em Estoque' && styles.textoEstoque
                ]}>
                  Status: {item.estatus}
                </Text>

                <Text style={styles.gps}>
                  Cadastrado em: {item.dataCadastro || 'Não registrada'}
                </Text>

                {item.observacoes ? (

                  <Text style={styles.observacaoCard}>
                    Obs.: {item.observacoes}
                  </Text>

                ) : null}

                <Text style={styles.gps}>
                  Latitude: {
                    item.latitude !== null
                      ? item.latitude.toFixed(6)
                      : 'Não registrada'
                  }
                </Text>

                <Text style={styles.gps}>
                  Longitude: {
                    item.longitude !== null
                      ? item.longitude.toFixed(6)
                      : 'Não registrada'
                  }
                </Text>

              </View>

              <QRCode
                value={item.pat}
                size={65}
              />

            </View>

          )}
          ListEmptyComponent={
            <Text style={styles.listaVazia}>
              Nenhum equipamento cadastrado.
            </Text>
          }
        />

        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => setTela('principal')}
        >
          <Text style={styles.textoBotao}>
            Voltar
          </Text>
        </TouchableOpacity>

      </SafeAreaView>

    );
  }

 

  return (

    <SafeAreaView style={styles.container}>

      <FlatList
        data={inventario}
        keyExtractor={item => item.id}

        ListHeaderComponent={

          <View>


            <View style={styles.header}>

              <Text style={styles.tituloHeader}>
                ETEC Guarulhos - APP Inventário
              </Text>

            </View>

            <View style={styles.areaBotoes}>

              <TouchableOpacity
                style={styles.botaoRelatorios}
                onPress={() => setTela('relatorios')}
              >
                <Text style={styles.textoBotao}>
                  Relatórios
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoScanner}
                onPress={iniciarScanner}
              >
                <Text style={styles.textoBotao}>
                  Escanear QR Code e/ou Consultar
                </Text>
              </TouchableOpacity>

            </View>


            <View style={styles.formulario}>

              <Text style={styles.tituloFormulario}>
                Cadastro de Equipamentos
              </Text>

              <Text style={styles.label}>
                Descrição do Equipamento
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ex: Switch Datacom 24 Portas"
                value={equipamento}
                onChangeText={setEquipamento}
              />

              <Text style={styles.label}>
                Nº Patrimônio
              </Text>

              <View style={[
                styles.input,
                styles.inputDesabilitado
              ]}>

                <Text style={styles.textoSequencialAutomatico}>
                  Gerado Automaticamente
                </Text>

              </View>

              <Text style={styles.label}>
                Laboratório / Sala
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ex: Laboratório de Redes 4"
                value={sala}
                onChangeText={setSala}
              />

            

              {renderizarStatus()}

             

              {status === 'Em Manutenção' && (

                <View style={styles.areaObservacoes}>

                  <Text style={styles.label}>
                    Observações para manutenção
                  </Text>

                  <TextInput
                    style={styles.inputObservacoes}
                    placeholder="Descreva o problema ou como está o equipamento..."
                    value={observacoes}
                    onChangeText={setObservacoes}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />

                  <Text style={styles.ajudaObservacoes}>
                    Informe os defeitos ou reparos necessários.
                  </Text>

                </View>

              )}

             
              <TouchableOpacity
                style={styles.botaoCadastrar}
                onPress={adicionarAoInventario}
                activeOpacity={0.8}
              >

                <Text style={styles.textoBotao}>
                  + Cadastrar Equipamento
                </Text>

              </TouchableOpacity>

            </View>


            <Text style={styles.subtitulo}>
              Equipamentos Cadastrados localmente
            </Text>

            <Text style={styles.total}>
              Total: {inventario.length} equipamentos
            </Text>

          </View>

        }

        renderItem={({ item }) => (

          <View style={styles.cardEquipamento}>

            <View style={styles.infoHardware}>

              <Text style={styles.nomeCard}>
                {item.nome}
              </Text>

              <Text style={styles.patrimonioCard}>
                Pat: {item.pat}
              </Text>

              <Text style={styles.localCard}>
                {item.local}
              </Text>

              <Text style={[
                styles.estatusCard,
                item.estatus === 'Em Manutenção' && styles.textoManutencao,
                item.estatus === 'Em Estoque' && styles.textoEstoque
              ]}>
                {item.estatus}
              </Text>

              {item.observacoes ? (

                <Text style={styles.observacaoCard}>
                  Obs.: {item.observacoes}
                </Text>

              ) : null}

            </View>

            <QRCode
              value={item.pat}
              size={60}
            />

          </View>

        )}

        ListEmptyComponent={
          <Text style={styles.listaVazia}>
            Nenhum equipamento cadastrado.
          </Text>
        }

        contentContainerStyle={styles.lista}

      />

    </SafeAreaView>

  );

}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f4f6f9'
  },

  header: {
    minHeight: 75,
    backgroundColor: '#b22222',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    paddingTop: 20
  },

  tituloHeader: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center'
  },

  areaBotoes: {
    paddingHorizontal: 20,
    marginBottom: 15
  },

  formulario: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 15
  },

  tituloFormulario: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 15
  },

  label: {
    fontSize: 13,
    color: '#4a5568',
    fontWeight: '600',
    marginBottom: 5
  },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    marginBottom: 12
  },

  inputDesabilitado: {
    backgroundColor: '#e2e8f0',
    justifyContent: 'center'
  },

  textoSequencialAutomatico: {
    color: '#718096',
    fontSize: 13
  },

  // STATUS

  campoStatus: {
    marginBottom: 12
  },

  opcoesStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6
  },

  botaoStatus: {
    flex: 1,
    minHeight: 58,
    paddingVertical: 10,
    paddingHorizontal: 3,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },

  statusOperacao: {
    backgroundColor: '#c6f6d5',
    borderColor: '#24945c',
    borderWidth: 2
  },

  statusManutencao: {
    backgroundColor: '#feebc8',
    borderColor: '#d18b25',
    borderWidth: 2
  },

  statusEstoque: {
    backgroundColor: '#bee3f8',
    borderColor: '#397bc2',
    borderWidth: 2
  },

  textoStatus: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4a5568',
    textAlign: 'center'
  },

  textoStatusSelecionado: {
    color: '#1a202c'
  },

  checkStatus: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 3
  },


  areaObservacoes: {
    marginTop: 5,
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#fffaf0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f6d69b'
  },

  inputObservacoes: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2b76f',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    minHeight: 100
  },

  ajudaObservacoes: {
    color: '#718096',
    fontSize: 11,
    marginTop: 5
  },



  botaoRelatorios: {
    backgroundColor: '#6474de',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8
  },

  botaoScanner: {
    backgroundColor: '#3182ce',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center'
  },

  botaoCadastrar: {
    backgroundColor: '#2d3748',
    padding: 15,
    borderRadius: 7,
    alignItems: 'center',
    marginTop: 8
  },

  botaoVoltar: {
    backgroundColor: '#b22222',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    margin: 20
  },

  textoBotao: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center'
  },

  

  subtitulo: {
    fontSize: 15,
    color: '#1a202c',
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 8
  },

  total: {
    paddingHorizontal: 20,
    marginBottom: 10,
    color: '#718096',
    fontSize: 12
  },

  lista: {
    paddingBottom: 20
  },

  cardEquipamento: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#b22222',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },

  infoHardware: {
    flex: 1,
    paddingRight: 10
  },

  nomeCard: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2d3748'
  },

  patrimonioCard: {
    fontSize: 13,
    color: '#b22222',
    fontWeight: '600',
    marginTop: 3
  },

  localCard: {
    fontSize: 12,
    color: '#718096',
    marginTop: 3
  },

  estatusCard: {
    fontSize: 12,
    color: '#24945c',
    fontWeight: 'bold',
    marginTop: 4
  },

  textoManutencao: {
    color: '#d18b25'
  },

  textoEstoque: {
    color: '#397bc2'
  },

  observacaoCard: {
    fontSize: 12,
    color: '#805b24',
    marginTop: 5
  },

  gps: {
    fontSize: 12,
    color: '#4a5568',
    marginTop: 4
  },

  listaVazia: {
    textAlign: 'center',
    color: '#718096',
    padding: 25,
    fontSize: 13
  },


  containerCamera: {
    flex: 1,
    backgroundColor: '#000'
  },

  overlayCamera: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 40
  },

  textoInstrucaoCamera: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8
  },

  botaoFecharCamera: {
    backgroundColor: '#b22222',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center'
  }

});