import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';

import { MatSnackBar } from '@angular/material/snack-bar';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConsultasService } from 'src/services/consultas.service';
import * as THREE from 'three';
import * as WEBIFC from 'web-ifc';

import { Mouse } from '@thatopen/components';
import {
  CSS2DObject,
  CSS2DRenderer,
} from 'three/examples/jsm/renderers/CSS2DRenderer';
import { lastValueFrom } from 'rxjs';

interface Elemento {
  informacion: any;
  active: boolean;
  nivel: any;
  clase: number;
  claseTraducida: string;
  mostrar: boolean;
  ind: number | null;
  visible: boolean;
  propiedades: any;
  vinculos: any;
  vinculado: boolean;
  nroIncluidos: number;
}

interface Plantilla {
  descripcion: string;
  tipo: string;

  clave_metrado: string;
  cantidad: string;
  n_veces: string;
  largo: string;
  ancho: string;
  altura: string;
  id_plantilla: any;
  ind: number;
  editardescripcion: boolean;
  editarclave_metrado: boolean;
  editarcantidad: boolean;
  editarn_veces: boolean;
  editarlargo: boolean;
  editarancho: boolean;
  editaraltura: boolean;
  editartipo: boolean;
  editararchivo: boolean;
  archivo: string;
  [key: string]: boolean | string | number | undefined;
}

interface Metrado {
  descripcion: string;
  esMetrado: number;
  item: string;
  id_metrado: number;
  indice: number;
  id_proyecto: number;
  cantidad: string;
  n_veces: string;
  largo: string;
  ancho: string;
  altura: string;
  parcial: string;
  subtotal: string;
  tieneAceros: number;
  tieneSubmetrado: number;
  estitulo: number;
  archivo: any;
  estilo: string;
  id_padre: string;
  ind: number;
  mostrar: boolean;
  toggle: boolean;
  checked: boolean;
  ejes: string;
  detalle: string;
  editarejes: boolean;
  editardetalle: boolean;
  fragmentId: any;
}

// interface IFCCartesianPoint {
//   type: 'IFCCARTESIANPOINT';
//   coordinates: [number, number, number];
// }

// interface IFCDirection {
//   type: 'IFCDIRECTION';
//   directionRatios: [number, number, number];
// }

// interface IFCPolyLoop {
//   type: 'IFCPOLYLOOP';
//   Polygon: IFCCartesianPoint[];
// }

// interface IFCFaceOuterBound {
//   type: 'IFCFACEOUTERBOUND';
//   Bound: IFCPolyLoop;
//   Orientation: boolean;
// }

// interface IFCAxis2Placement3D {
//   Location: IFCCartesianPoint;
//   Axis?: IFCDirection;
//   RefDirection?: IFCFaceOuterBound | IFCDirection;
// }

// interface IFCLocalPlacement {
//   type: 'IFCLOCALPLACEMENT';
//   PlacementRelTo: IFCLocalPlacement | null;
//   RelativePlacement: IFCAxis2Placement3D;
// }

// interface ObjectPlacement {
//   type: 'IFCLOCALPLACEMENT';
//   PlacementRelTo: IFCLocalPlacement | null;
//   RelativePlacement: IFCAxis2Placement3D;
// }

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChildren('selectcantidad') selectElements!: QueryList<ElementRef>;
  @ViewChildren('inputcantidad') inputElements!: QueryList<ElementRef>;
  stateOptions: { label: string; value: number }[] = [
    { label: 'Vinculo', value: 1 },
    { label: 'Metrado', value: 2 },
  ];
  coloresBasicosHex: string[] = [
    '#1e9797', // Beige
    '#000000', // Negro
    '#c0c0c0', // Plateado
    '#ffc0cb', // Rosa
    '#ffd700', // Dorado
    '#ffff00', // Amarillo
    '#00ffff', // Cian
    '#ff6347', // Rojo fuerte
    '#ff00ff', // Magenta
    '#ee82ee', // Violeta
    '#00ff00', // Lima
    '#808080', // Gris
    '#008080', // Verde azulado
    '#008000', // Verde
    '#4b0082', // Índigo
    '#800080', // Púrpura
    '#a52a2a', // Marrón
    '#ff0000', // Rojo
    '#0000ff', // Azul

    '#ffa500', // Naranja
  ];
  @ViewChildren('fila') filas!: QueryList<ElementRef>;
  tipoTabla = 0;
  selectedFile!: File;
  infoSeleccionado: any = null;
  container: HTMLElement | null = null; // Iniciar como null
  mostrarNavbar = true;
  dataIFC: Elemento[] = [];
  tablaGrupos: Elemento[] = [];
  filaSel: any = null;
  arrayCompleto: any;
  verDimensiones = false;
  verVolumen = false;
  dimensions!: OBCF.EdgeMeasurement;
  volumen!: OBCF.VolumeMeasurement;
  guid = '';
  nivel = '';
  @ViewChild('fileInput', { static: false }) fileInput: any;
  components!: OBC.Components;
  arrFragments = [];
  items = [];
  tab: number = 0;
  buscando = false;
  buscando2 = false;
  buscando3 = false;
  dataGeometrica: any = {};
  highlighter!: OBCF.Highlighter;
  noCargarData: boolean = false;
  allTypes: any[] = [];
  filteredEntities!: any[];
  indexer!: OBC.IfcRelationsIndexer;
  model: any;
  vinculoActivado = false;
  multGrafico = false;
  tablaMetrado: any;
  paso = 0;
  filPres = null;
  multPres = false;
  grid!: OBC.SimpleGrid;
  verGrid = false;
  area!: OBCF.AreaMeasurement;
  face!: OBCF.FaceMeasurement;
  isCtrlPressed = false;
  multAcumulados: any = {};
  // world!: OBC.SimpleWorld<
  //   OBC.SimpleScene,
  //   OBC.SimpleCamera,
  //   OBCF.PostproductionRenderer
  // >;
  world!: OBC.SimpleWorld<
    OBC.SimpleScene,
    OBC.SimpleCamera,
    OBCF.RendererWith2D
  >;
  searchText = '';
  arrGlobalsIds: any = {};
  listaVinculados: any[] = [];
  codigoDocumento = null;
  bloqVincPartid = false;
  visible: boolean = false;
  visible2: boolean = false;
  visible3: boolean = false;
  visible4: boolean = false;
  vinculadosPartida: any = null;
  filaResum: any = null;
  ultimoVincResl: any = null;
  loading = false;
  classifier!: OBC.Classifier;
  coloresRestaurar2: any = {};
  // coloresRestaurar: any[] = [];
  coloresRestaurarVol: any[] = [];
  indCopVinc: number[] = [];
  id_proyecto: number = 285; // 291 l  -- 285 ing
  id_usuario: number = 9; // 3 l - 9 ing
  tablaPlantilla: Plantilla[] = [];
  mostrarPrevPlant: boolean = false;
  gruposVinc: any = {};
  gruposKeys: any[] = [];
  gruposGlobalIds: any[] = [];
  gruposVisibles: boolean[] = [];
  dataGrupoSel: any = null;
  // tipoFila = [
  //   { nombre: 'Tit', valor: 0 },
  //   { nombre: 'Metrado', valor: 1 },
  //   { nombre: 'Submetrado', valor: 2 },
  // ];
  tipoFila = ['', 'Tit', 'Met', 'Subm'];
  selectGrupos: string[] = [];
  filaPlantilla: number | null = null;
  nroFilas = 1;
  @ViewChild('tableContainer') tableContainer!: ElementRef;
  tablaGenerada: any[] = [];
  imagen: any;
  totalPartida: number = 0;
  zoomSelected: boolean = false;
  casters!: OBC.Raycasters;
  clipper!: OBC.Clipper;
  verClipper: boolean = false;
  edges!: OBCF.ClipEdges;
  marker!: OBCF.Marker;
  selectedFragments: any = {};
  acumuladosVolumen: any[] = [];
  acumuladosArea: any[] = [];
  acumuladosPerimetro: any[] = [];
  meshAgregados: any[] = [];
  longitud!: OBCF.LengthMeasurement;
  gridsKeys: any[] = [];
  puntosCartesianos: any[] = [];
  css2DRenderer: any;
  arrayLineas: any[] = [];
  diccionarioIfc: any;
  tablaMetradoTit: {
    titulo: string; // Título del grupo
    elementos: any[];
    detalles: any;
  }[] = [];
  ultResTabGen: any;
  resalListaGrup: any = null;
  get isNotEmpty() {
    if (Object.keys(this.multAcumulados).length > 0) {
      return Object.keys(this.multAcumulados).length > 0;
    } else if (Object.keys(this.selectedFragments).length > 0) {
      return Object.keys(this.selectedFragments).length > 0;
    } else {
      return null;
    }
  }
  decimales = '3';
  maximizarPlant: boolean = false;
  imagenInvalida: boolean = false;
  filSelVinc: any = null;
  formula: string = '';
  ultimaCelda: any = null;
  clavedocColors: { [key: string]: string } = {};
  colorDocumento: string = '';
  expresIdInd: Record<number, any> = {};

  capturarArea: boolean = false;
  capturarPerimetro: boolean = false;
  capturarVolumen: boolean = false;
  capturarLongitud: boolean = false;
  formulaManual: string = '';
  oculPanelClipper = false;
  tipoManualData: boolean = false;
  clipperColor = {
    colorHex: '#000000', // Valor inicial en formato hexadecimal
    material: {
      color: new THREE.Color('#000000'), // Inicializa con el mismo valor
    },
  };

  mouse!: Mouse;
  elementFormulas: any[] = [];
  result: string = '';
  isFormulaValid: boolean = true;
  private renderer!: THREE.WebGLRenderer;
  highlightVol = {};
  verEjes = false;
  private createdObjects: Set<THREE.Object3D> = new Set();
  textContDoc = '';
  unidadesGlobales: any = {};
  titSelect: any = null;
  verColEjes: boolean = false;
  verColDetalle: boolean = false;
  filTabGenerada: any[] = [];
  unidades: any = {
    AREAUNIT: 'UNIDAD_DE_AREA',
    SQUARE_METRE: 'METRO_CUADRADO',
    SQUARE_KILOMETRE: 'KILOMETRO_CUADRADO',
    HECTARE: 'HECTAREA',
    ELECTRICCURRENTUNIT: 'UNIDAD_DE_CORRIENTE_ELECTRICA',
    AMPERE: 'AMPERIO',
    MILLIAMPERE: 'MILIAMPERIO',
    ELECTRICVOLTAGEUNIT: 'UNIDAD_DE_VOLTAJE_ELECTRICO',
    VOLT: 'VOLTIO',
    KILOVOLT: 'KILOVOLTIO',
    MILLIVOLT: 'MILIVOLTIO',
    FORCEUNIT: 'UNIDAD_DE_FUERZA',
    NEWTON: 'NEWTON',
    KILONEWTON: 'KILONEWTON',
    FREQUENCYUNIT: 'UNIDAD_DE_FRECUENCIA',
    HERTZ: 'HERTZ',
    KILOHERTZ: 'KILOHERTZ',
    MEGAHERTZ: 'MEGAHERTZ',
    ILLUMINANCEUNIT: 'UNIDAD_DE_ILUMINANCIA',
    LUX: 'LUX',
    LENGTHUNIT: 'UNIDAD_DE_LONGITUD',
    METRE: 'METRO',
    KILOMETRE: 'KILOMETRO',
    CENTIMETRE: 'CENTIMETRO',
    MILLIMETRE: 'MILIMETRO',
    LUMINOUSFLUXUNIT: 'UNIDAD_DE_FLUJO_LUMINOSO',
    LUMEN: 'LUMEN',
    LUMINOUSINTENSITYUNIT: 'UNIDAD_DE_INTENSIDAD_LUMINOSA',
    CANDELA: 'CANDELA',
    MASSUNIT: 'UNIDAD_DE_MASA',
    GRAM: 'GRAMO',
    KILOGRAM: 'KILOGRAMO',
    MILLIGRAM: 'MILIGRAMO',
    TONNE: 'TONELADA',
    PLANEANGLEUNIT: 'UNIDAD_DE_ANGULO_PLANO',
    RADIAN: 'RADIAN',
    DEGREE: 'GRADO',
    POWERUNIT: 'UNIDAD_DE_POTENCIA',
    WATT: 'VATIO',
    KILOWATT: 'KILOVATIO',
    MEGAWATT: 'MEGAVATIO',
    PRESSUREUNIT: 'UNIDAD_DE_PRESION',
    PASCAL: 'PASCAL',
    KILOPASCAL: 'KILOPASCAL',
    BAR: 'BAR',
    THERMODYNAMICTEMPERATUREUNIT: 'UNIDAD_DE_TEMPERATURA_TERMODINAMICA',
    DEGREE_CELSIUS: 'GRADO_CELSIUS',
    KELVIN: 'KELVIN',
    TIMEUNIT: 'UNIDAD_DE_TIEMPO',
    SECOND: 'SEGUNDO',
    MINUTE: 'MINUTO',
    HOUR: 'HORA',
    DAY: 'DIA',
    VOLUMEUNIT: 'UNIDAD_DE_VOLUMEN',
    CUBIC_METRE: 'METRO_CUBICO',
    LITRE: 'LITRO',
    MILLILITRE: 'MILILITRO',
    GALLON: 'GALON',
  };

  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  tablaDetalles: any[] = [];
  constructor(
    private cdr: ChangeDetectorRef,
    private consulta: ConsultasService,
    private _snackBar: MatSnackBar,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private eRef: ElementRef
  ) {}

  async buscar(map: any) {
    const array = Object.keys(map);
    const values = Object.values(map);
    const uniqueValues = [...new Set(values.flatMap((set: any) => [...set]))];
    let data: any = null;
    for (const element of uniqueValues) {
      const elemento = this.arrayCompleto[element];
      data = elemento;
    }
    if (data) {
      const index = this.dataIFC.findIndex((ele) => ele.informacion === data);
      if (index !== -1) {
        const elemento = this.dataIFC[index];
        if (!this.noCargarData) {
          this.seleccionRow(elemento, index, true);
        } else {
          this.noCargarData = false;
        }
      }
    } else {
      this.dataGeometrica = {};
    }

    // let menorx = Infinity;
    // let menory = Infinity;
    // let menorz = Infinity;
    // let mayorx = -Infinity;
    // let mayory = -Infinity;
    // let mayorz = -Infinity;

    // let arr: any[] = [];
    // for (const element of array) {
    //   const row: any = this.arrFragments.find(
    //     (ele: any) => ele.uuid === element
    //   );
    //   if (row) {
    //     arr.push(row);
    //     if (row.geometry && row.geometry.boundingBox) {
    //       row.geometry.computeBoundingBox();
    //       const boundingBox = row.geometry.boundingBox;
    //       menorx = Math.min(menorx, boundingBox.min.x);
    //       menory = Math.min(menory, boundingBox.min.y);
    //       menorz = Math.min(menorz, boundingBox.min.z);
    //       mayorx = Math.max(mayorx, boundingBox.max.x);
    //       mayory = Math.max(mayory, boundingBox.max.y);
    //       mayorz = Math.max(mayorz, boundingBox.max.z);
    //       const x1 = Number((boundingBox.max.x - boundingBox.min.x).toFixed(2));
    //       const y1 = Number((boundingBox.max.y - boundingBox.min.y).toFixed(2));
    //       const z1 = Number((boundingBox.max.z - boundingBox.min.z).toFixed(2));
    //     }
    //   }
    // }

    // // if (this.verVolumen) {
    // // volumen = await this.volumen.getVolumeFromMeshes(arr);
    // volumen = await this.volumen.getVolumeFromFragments(map);
    // this.volumen.clear();

    // // }

    // const x = Number((mayorx - menorx).toFixed(2));
    // const y = Number((mayory - menory).toFixed(2));
    // const z = Number((mayorz - menorz).toFixed(2));
    // // const volumen2 = x * y * z;
    // const AreaTotal = 2 * (x * y + x * z + y * z);
    // const a = x * y;
    // const b = x * z;
    // const c = y * z;
    // const AreaMaxima = Math.max(a, b, c);
    // const Thickness = Math.min(x, y, z);
    // this.dataGeometrica = {
    //   boundingboxlength: x,
    //   boundingboxwidth: y,
    //   boundingboxheight: z,
    //   volumen: volumen,
    //   AreaTotal: AreaTotal,
    //   AreaMaxima: AreaMaxima,
    //   Thickness: Thickness,
    // };
    this.dataGeometrica = await this.verBounding(map);
    this.noCargarData = false;
  }

  async antOcultos(index: number) {
    const seleccionado = this.dataIFC[index];
    let nivelBusq = seleccionado.nivel;
    let iniciado = false;
    for (let i = index - 1; i >= 0; i--) {
      const element = this.dataIFC[i];
      if (nivelBusq == element.nivel) {
        this.dataIFC[i].mostrar = true;
        if (iniciado) {
          this.dataIFC[i].active = true;
        }
      } else if (nivelBusq - 1 == element.nivel) {
        nivelBusq = element.nivel;
        this.dataIFC[i].mostrar = true;
        this.dataIFC[i].active = false;
        iniciado = true;
      } else {
      }
    }
    for (let i = index + 1; i < this.dataIFC.length; i++) {
      const element = this.dataIFC[i];
      if (element.nivel == seleccionado.nivel) {
        this.dataIFC[i].mostrar = true;
      } else if (element.nivel < seleccionado.nivel) {
        break;
      }
    }
    this.cdr.detectChanges();
  }

  ngAfterViewInit() {
    this.container = document.getElementById('container');
  }

  async ngOnInit() {
    try {
      const obj2 = {
        id_proyecto: this.id_proyecto,
        titulo: '',
      };
      const metrado = await this.consulta.ListarMetradoIfc(obj2);
      if (metrado) {
        const obj = {
          id_proyecto: this.id_proyecto,
          indice: '',
          todo: 1,
        };
        const detalleList = await lastValueFrom(
          this.consulta.listarDetalleMetradoIfc(obj)
        );
        const grupos: { [key: string]: any[] } = {};

        metrado.forEach((element: any, index: number) => {
          element.vinculo = false;
          element.ind = index;
          if (element.clavedoc && element.clavedoc.trim() !== '') {
            if (!this.clavedocColors[element.clavedoc]) {
              const color = this.coloresBasicosHex.pop();
              if (color) {
                this.clavedocColors[element.clavedoc] = color;
              }
            }
            element['color'] = this.clavedocColors[element.clavedoc];
          } else {
            element['color'] = '';
          }
          element.icomost = 1;
          element.estmost = 1;
          element.mostrar = 1;
          const numeroInicial = element.item.split('.')[0];

          // Agrupar por el número inicial
          if (!grupos[numeroInicial]) {
            grupos[numeroInicial] = []; // Crear un nuevo grupo si no existe
          }
          grupos[numeroInicial].push(element);
        });

        const gruposArray = Object.keys(grupos).map((key) => ({
          titulo: grupos[key][0].item + ' - ' + grupos[key][0].descripcion, // Título del grupo
          elementos: grupos[key], // Elementos del grupo
          detalles: [],
        }));

        this.tablaMetradoTit = gruposArray;

        for (let element of this.tablaMetradoTit) {
          const arreglo = await this.recuperaDetalleMetrado(
            element.elementos,
            detalleList
          );
          element.detalles = arreglo;
        }
        if (this.tablaMetradoTit.length) {
          this.tablaMetrado = this.tablaMetradoTit[0].elementos;
          this.titSelect = this.tablaMetradoTit[0];
          this.tablaDetalles = this.tablaMetradoTit[0].detalles;
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  recuperaDetalleMetrado(elementos: any, detalleList: any) {
    let arreglos = [];
    for (const element of elementos) {
      const filtrados = detalleList.filter(
        (ele: any) => ele.indice == element.indice
      );
      const filtradosOrdenados = filtrados.sort(
        (a: any, b: any) => a.id_metrado - b.id_metrado
      );
      const filtradosConNuevasKeys = filtradosOrdenados.map((ele: Metrado) => {
        let fragmentIdDeserializado: any = '';

        if (ele.fragmentId && ele.fragmentId !== '') {
          try {
            fragmentIdDeserializado = JSON.parse(ele.fragmentId);
            if (Array.isArray(fragmentIdDeserializado)) {
              fragmentIdDeserializado = new Set(fragmentIdDeserializado); // Convertir a Set
            } else if (
              fragmentIdDeserializado &&
              typeof fragmentIdDeserializado === 'object'
            ) {
              for (const key in fragmentIdDeserializado) {
                if (Array.isArray(fragmentIdDeserializado[key])) {
                  fragmentIdDeserializado[key] = new Set(
                    fragmentIdDeserializado[key]
                  ); // Convertir a Set
                }
              }
            }
          } catch (error) {
            console.error('Error al parsear JSON:', error);
            fragmentIdDeserializado = '';
          }
        }

        return {
          ...ele,
          mostrar: true,
          toggle: false,
          checked: false,
          editarEjes: false,
          editardetalle: false,
          fragmentId: fragmentIdDeserializado, // Asignar el valor deserializado
        };
      });

      arreglos.push(filtradosConNuevasKeys);
    }
    return arreglos;
  }

  async cargarDocumento(event: any) {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.ifc')) {
      this.buscando = true;
      this.selectedFile = file;

      this.processFile(file);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Documento no valido',
      });
    }
  }

  async processText(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.textContDoc = e.target?.result as string;
        resolve(); // Resuelve la promesa cuando la lectura del archivo termina
      };

      reader.onerror = (e) => {
        console.error('Error al leer el archivo:', e);
        reject(e); // Rechaza la promesa si hay un error
      };

      reader.readAsText(file);
    });
  }
  // extractCartesianPoints(ifcText: string) {
  //   const lines = ifcText
  //     .split('\n')
  //     .map((line) => line.trim())
  //     .filter((line) => line);
  //   const cartesianPoints: any = {};
  //   const diccionarioIfc: any = {};
  //   for (const line of lines) {
  //     const match = line.match(/^#(\d+)=IFCCARTESIANPOINT\(\(([^)]+)\)\);$/);

  //     if (match) {
  //       const idExpress = parseInt(match[1], 10);
  //       const vector = match[2].split(',').map((coord) => parseFloat(coord));
  //       const tipo = 'cartesiano';

  //       cartesianPoints[idExpress] = { idExpress, vector, tipo, line };
  //       diccionarioIfc[idExpress] = line;
  //     }
  //     const match2 = line.match(/^#(\d+)=IFCPOLYLINE\(\(([^)]+)\)\);$/);
  //     if (match2) {
  //       const idExpress = parseInt(match2[1], 10);
  //       const points = match2[2]
  //         .split(',#')
  //         .map((id) => parseInt(id.replace('#', ''), 10));
  //       const tipo = 'Polyline';
  //       if (points.length >= 2) {
  //         cartesianPoints[idExpress] = {
  //           puntoA: points[0],
  //           puntoB: points[points.length - 1],
  //           tipo,
  //           line,
  //         };
  //       }
  //       diccionarioIfc[idExpress] = line;
  //     }
  //     // const matchPlacement = line.match(/#(\d+)=IFCLOCALPLACEMENT\(#(\d+),\s?(\d+)\);/);
  //     const reemplazo = line.includes('=IFCLOCALPLACEMENT(');
  //     if (reemplazo) {
  //       const matchPlacement = line
  //         .replace('=IFCLOCALPLACEMENT(', '')
  //         .replace(',', '')
  //         .replace(');', '')
  //         .trim()
  //         .split(/[#\$]/);
  //       const idExpress = Number(matchPlacement[1]);
  //       const placementValue =
  //         matchPlacement[2] !== '$' ? Number(matchPlacement[2]) : null; // '47'
  //       const axisValue =
  //         matchPlacement[3] !== '$' ? Number(matchPlacement[3]) : null;
  //       cartesianPoints[idExpress] = {
  //         idExpress,
  //         tipo: 'IFCLOCALPLACEMENT',
  //         line,
  //         ubicacion: { value: placementValue },
  //         orientacion: { value: axisValue },
  //       };
  //       diccionarioIfc[idExpress] = line;
  //     }

  //     const matchAxisPlacement = line.match(
  //       /#(\d+)=IFCAXIS2PLACEMENT3D\(#(\d+),(?:#(\d+)|\$),(?:#(\d+)|\$)\)/
  //     );

  //     if (matchAxisPlacement) {
  //       const idExpress = parseInt(matchAxisPlacement[1], 10);
  //       const locationValue = parseInt(matchAxisPlacement[2], 10);

  //       cartesianPoints[idExpress] = {
  //         idExpress,
  //         tipo: 'IFCAXIS2PLACEMENT3D',
  //         line,
  //         location: { value: locationValue },
  //       };
  //       diccionarioIfc[idExpress] = line;
  //     }

  //     const matchGridAxis = line.match(
  //       /#(\d+)=IFCGRIDAXIS\('([^']*(?:''[^']*)*)',#(\d+),(.+)\);/
  //     );

  //     if (matchGridAxis) {
  //       const idExpress = parseInt(matchGridAxis[1], 10);
  //       const axisName = matchGridAxis[2]; // '1'
  //       const polylineRef = parseInt(matchGridAxis[3], 10);
  //       const directionSense = matchGridAxis[4].trim() === '.T.'; // .T. = true, .F. = false

  //       cartesianPoints[idExpress] = {
  //         idExpress,
  //         tipo: 'IFCGRIDAXIS',
  //         axisName,
  //         polylineRef,
  //         directionSense,
  //       };
  //       diccionarioIfc[idExpress] = line;
  //     }
  //   }
  //   return { cartesianPoints, diccionarioIfc };
  // }

  async extractCartesianPoints(ifcText: string) {
    const lines = ifcText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line);
    const diccionarioIfc: any = {};
    for (const line of lines) {
      const match = line.match(/^#(\d+)=IFCCARTESIANPOINT\(\(([^)]+)\)\);$/);
      if (match) {
        const idExpress = parseInt(match[1], 10);
        diccionarioIfc[idExpress] = line;
        continue;
      }
      const match2 = line.match(/^#(\d+)=IFCPOLYLINE\(\(([^)]+)\)\);$/);
      if (match2) {
        const idExpress = parseInt(match2[1], 10);

        diccionarioIfc[idExpress] = line;
        continue;
      }
      // const matchPlacement = line.match(/#(\d+)=IFCLOCALPLACEMENT\(#(\d+),\s?(\d+)\);/);
      const reemplazo = line.includes('=IFCLOCALPLACEMENT(');
      if (reemplazo) {
        const matchPlacement = line
          .replace('=IFCLOCALPLACEMENT(', '')
          .replace(',', '')
          .replace(');', '')
          .trim()
          .split(/[#\$]/);
        const idExpress = Number(matchPlacement[1]);

        diccionarioIfc[idExpress] = line;
        continue;
      }
      const matchAxisPlacement = line.match(
        /#(\d+)=IFCAXIS2PLACEMENT3D\(#(\d+),(?:#(\d+)|\$),(?:#(\d+)|\$)\)/
      );
      if (matchAxisPlacement) {
        const idExpress = parseInt(matchAxisPlacement[1], 10);

        diccionarioIfc[idExpress] = line;
        continue;
      }
      const matchGridAxis = line.match(
        /#(\d+)=IFCGRIDAXIS\('([^']*(?:''[^']*)*)',#(\d+),(.+)\);/
      );
      if (matchGridAxis) {
        const idExpress = parseInt(matchGridAxis[1], 10);

        diccionarioIfc[idExpress] = line;
        continue;
      }

      const matchDirection = line.includes('=IFCDIRECTION(');
      if (matchDirection) {
        const id: string = parseInt(line.replace('#', '')).toString();
        const idExpress = parseInt(id);
        diccionarioIfc[idExpress] = line;
        continue;
      }
    }
    return diccionarioIfc;
  }

  // renderizarLineas2() {
  //   let arrayLineas = [];
  //   for (const element of this.gridsKeys) {
  //     const objeto = JSON.parse(
  //       JSON.stringify(this.arrayCompleto[Number(element)])
  //     );
  //     const objectPlacement = JSON.parse(
  //       JSON.stringify(this.puntosCartesianos[objeto.ObjectPlacement.value])
  //     );
  //     objeto.ObjectPlacement = objectPlacement;
  //     objectPlacement.orientacion = JSON.parse(
  //       JSON.stringify(
  //         this.puntosCartesianos[objectPlacement.orientacion.value]
  //       )
  //     );
  //     objectPlacement.orientacion.location = JSON.parse(
  //       JSON.stringify(
  //         this.puntosCartesianos[objectPlacement.orientacion.location.value]
  //       )
  //     );

  //     objectPlacement.ubicacion = JSON.parse(
  //       JSON.stringify(this.puntosCartesianos[objectPlacement.ubicacion.value])
  //     );

  //     if (objectPlacement.ubicacion.orientacion.value) {
  //       objectPlacement.ubicacion.orientacion = JSON.parse(
  //         JSON.stringify(
  //           this.puntosCartesianos[objectPlacement.ubicacion.orientacion.value]
  //         )
  //       );
  //       objectPlacement.ubicacion.orientacion.location = JSON.parse(
  //         JSON.stringify(
  //           this.puntosCartesianos[
  //             objectPlacement.ubicacion.orientacion.location.value
  //           ]
  //         )
  //       );
  //     }

  //     if (objectPlacement.ubicacion.ubicacion.value) {
  //       objectPlacement.ubicacion.ubicacion = JSON.parse(
  //         JSON.stringify(
  //           this.puntosCartesianos[objectPlacement.ubicacion.ubicacion.value]
  //         )
  //       );
  //       if (objectPlacement.ubicacion?.ubicacion?.orientacion?.value) {
  //         objectPlacement.ubicacion.ubicacion.orientacion = JSON.parse(
  //           JSON.stringify(
  //             this.puntosCartesianos[
  //               objectPlacement.ubicacion.ubicacion.orientacion.value
  //             ]
  //           )
  //         );
  //         objectPlacement.ubicacion.ubicacion.orientacion.location = JSON.parse(
  //           JSON.stringify(
  //             this.puntosCartesianos[
  //               objectPlacement.ubicacion.ubicacion.orientacion.location.value
  //             ]
  //           )
  //         );
  //       }
  //     }

  //     if (objeto.UAxes.length) {
  //       let i = 0;
  //       for (let element of objeto.UAxes) {
  //         let gridAxis = JSON.parse(
  //           JSON.stringify(this.puntosCartesianos[element.value])
  //         );
  //         const polin = JSON.parse(
  //           JSON.stringify(this.puntosCartesianos[gridAxis.polylineRef])
  //         );
  //         gridAxis.polylineRef = polin;
  //         gridAxis.polylineRef.puntoA = JSON.parse(
  //           JSON.stringify(this.puntosCartesianos[gridAxis.polylineRef.puntoA])
  //         );
  //         gridAxis.polylineRef.puntoB = JSON.parse(
  //           JSON.stringify(this.puntosCartesianos[gridAxis.polylineRef.puntoB])
  //         );
  //         objeto.UAxes[i] = gridAxis;
  //         i++;
  //       }
  //     }
  //     if (objeto.VAxes.length) {
  //       let i = 0;
  //       for (let element of objeto.VAxes) {
  //         let gridAxis = JSON.parse(
  //           JSON.stringify(this.puntosCartesianos[element.value])
  //         );
  //         const polin = JSON.parse(
  //           JSON.stringify(this.puntosCartesianos[gridAxis.polylineRef])
  //         );
  //         gridAxis.polylineRef = polin;
  //         gridAxis.polylineRef.puntoA = JSON.parse(
  //           JSON.stringify(this.puntosCartesianos[gridAxis.polylineRef.puntoA])
  //         );
  //         gridAxis.polylineRef.puntoB = JSON.parse(
  //           JSON.stringify(this.puntosCartesianos[gridAxis.polylineRef.puntoB])
  //         );
  //         objeto.VAxes[i] = gridAxis;
  //         i++;
  //       }
  //     }
  //     if (objeto.WAxes && objeto.WAxes.length) {
  //       let i = 0;
  //       for (let element of objeto.WAxes) {
  //         let gridAxis = JSON.parse(
  //           JSON.stringify(this.puntosCartesianos[element.value])
  //         );
  //         const polin = JSON.parse(
  //           JSON.stringify(this.puntosCartesianos[gridAxis.polylineRef])
  //         );
  //         gridAxis.polylineRef = polin;
  //         gridAxis.polylineRef.puntoA = JSON.parse(
  //           JSON.stringify(this.puntosCartesianos[gridAxis.polylineRef.puntoA])
  //         );
  //         gridAxis.polylineRef.puntoB = JSON.parse(
  //           JSON.stringify(this.puntosCartesianos[gridAxis.polylineRef.puntoB])
  //         );
  //         objeto.WAxes[i] = gridAxis;
  //         i++;
  //       }
  //     }

  //     arrayLineas.push(objeto);
  //   }
  //   this.arrayLineas = arrayLineas;
  // }

  async renderizarLineas() {
    let arrayLineas = [];
    for (const element of this.gridsKeys) {
      const objeto = JSON.parse(
        JSON.stringify(this.arrayCompleto[Number(element)])
      );
      const objectPlacement = this.diccionarioIfc[objeto.ObjectPlacement.value];
      const local: any = await this.parsearLine(
        'IFCLOCALPLACEMENT',
        objectPlacement
      );
      objeto.ObjectPlacement = local;
      if (typeof local == 'string') {
        // return null;
      } else {
        if (typeof local === 'object' && local.PlacementRelTo) {
          const place = this.diccionarioIfc[local.PlacementRelTo];
          const local2 = await this.parsearLine('IFCLOCALPLACEMENT', place);

          local.PlacementRelTo = local2;
          if (typeof local2 === 'object' && local2.PlacementRelTo) {
            const place2 = this.diccionarioIfc[local2.PlacementRelTo];
            const local3: any = await this.parsearLine(
              'IFCLOCALPLACEMENT',
              place2
            );

            local2.PlacementRelTo = local3;
            if (typeof local3 === 'object' && local3.PlacementRelTo) {
              const place3 = this.diccionarioIfc[local3.PlacementRelTo];
              const local4: any = await this.parsearLine(
                'IFCLOCALPLACEMENT',
                place3
              );
            }
            if (typeof local3 === 'object' && local3.RelativePlacement) {
              const relat = this.diccionarioIfc[local3.RelativePlacement];
              const locat2: any = await this.parsearLine(
                'IFCAXIS2PLACEMENT3D',
                relat
              );
              local3.RelativePlacement = locat2;
              if (typeof locat2 === 'object' && locat2.Location) {
                const location = this.diccionarioIfc[locat2.Location];
                const coordinates = await this.parsearLine(
                  'IFCCARTESIANPOINT',
                  location
                );
                locat2.Location = coordinates;
              }
            }
          }

          if (typeof local2 === 'object' && local2.RelativePlacement) {
            const relat = this.diccionarioIfc[local2.RelativePlacement];
            const locat2: any = await this.parsearLine(
              'IFCAXIS2PLACEMENT3D',
              relat
            );

            local2.RelativePlacement = locat2;
            if (typeof locat2 === 'object' && locat2.Location) {
              const location = this.diccionarioIfc[locat2.Location];
              const coordinates = await this.parsearLine(
                'IFCCARTESIANPOINT',
                location
              );
              locat2.Location = coordinates;
            }
          }
        }
        if (typeof local === 'object' && local.RelativePlacement) {
          const relat = this.diccionarioIfc[local.RelativePlacement];
          const locat2: any = await this.parsearLine(
            'IFCAXIS2PLACEMENT3D',
            relat
          );
          local.RelativePlacement = locat2;
          if (typeof locat2 === 'object' && locat2.Location) {
            const location = this.diccionarioIfc[locat2.Location];
            const coordinates = await this.parsearLine(
              'IFCCARTESIANPOINT',
              location
            );
            locat2.Location = coordinates;
          }
        }
      }
      if (objeto.UAxes.length) {
        let i = 0;
        for (let element of objeto.UAxes) {
          const stringUAxes = this.diccionarioIfc[element.value];
          const axis = await this.parsearLine('IFCGRIDAXIS', stringUAxes);
          objeto.UAxes[i] = axis;
          i++;
        }
      }
      if (objeto.VAxes.length) {
        let i = 0;
        for (let element of objeto.VAxes) {
          const stringVAxes = this.diccionarioIfc[element.value];
          const axis = await this.parsearLine('IFCGRIDAXIS', stringVAxes);
          objeto.VAxes[i] = axis;
          i++;
        }
      }
      if (objeto.WAxes && objeto.WAxes.length) {
        let i = 0;
        for (let element of objeto.WAxes) {
          const stringWAxes = this.diccionarioIfc[element.value];
          const axis = await this.parsearLine('IFCGRIDAXIS', stringWAxes);
          objeto.WAxes[i] = axis;
          i++;
        }
      }

      arrayLineas.push(objeto);
    }
    this.arrayLineas = arrayLineas;
  }

  async parsearLine(tipo: string, line: string) {
    if (tipo == 'IFCLOCALPLACEMENT') {
      const matchPlacement = line
        .replace('=IFCLOCALPLACEMENT(', '')
        .replace(',', '')
        .replace(');', '')
        .trim()
        .split(/[#\$]/);
      if (matchPlacement) {
        return {
          PlacementRelTo:
            matchPlacement[2] !== '$' ? Number(matchPlacement[2]) : null,
          RelativePlacement:
            matchPlacement[3] !== '$' ? Number(matchPlacement[3]) : null,
        };
      } else {
        console.warn('matchPlacement', matchPlacement);
        console.warn('IFCLOCALPLACEMENT', line);
        return line;
      }
    } else if (tipo == 'IFCAXIS2PLACEMENT3D') {
      const matchAxisPlacement = line.match(
        /#(\d+)=IFCAXIS2PLACEMENT3D\(#(\d+),(?:#(\d+)|\$),(?:#(\d+)|\$)\)/
      );
      if (matchAxisPlacement) {
        let refDir: any =
          matchAxisPlacement[4] && !isNaN(Number(matchAxisPlacement[4]))
            ? Number(matchAxisPlacement[4])
            : null;
        if (refDir) {
          const lineaRef = this.diccionarioIfc[refDir];
          const direction = await this.parsearLine('IFCDIRECTION', lineaRef);
          refDir = direction;
        }
        let Axis: any =
          matchAxisPlacement[3] && !isNaN(Number(matchAxisPlacement[3]))
            ? Number(matchAxisPlacement[3])
            : null;
        if (Axis) {
          const lineAxis = this.diccionarioIfc[Axis];
          const axisRec = await this.parsearLine('IFCDIRECTION', lineAxis);
          Axis = axisRec;
        }

        return {
          Location:
            matchAxisPlacement[2] && !isNaN(Number(matchAxisPlacement[2]))
              ? Number(matchAxisPlacement[2])
              : null,
          Axis: Axis,
          RefDirection: refDir,
        };
      } else {
        console.warn('matchAxisPlacement', matchAxisPlacement);
        console.warn('IFCAXIS2PLACEMENT3D', line);
        return line;
      }
    } else if (tipo == 'IFCCARTESIANPOINT') {
      const match = line.match(/^#(\d+)=IFCCARTESIANPOINT\(\(([^)]+)\)\);$/);
      if (match) {
        const vector = match[2].split(',').map((coord) => parseFloat(coord));
        return {
          x: vector[0] == undefined ? 0 : vector[0],
          y: vector[1] == undefined ? 0 : vector[1],
          z: vector[2] == undefined ? 0 : vector[2],
        };
      } else {
        console.warn('match', match);
        console.warn('IFCCARTESIANPOINT', line);
        return line;
      }
    } else if (tipo == 'IFCGRIDAXIS') {
      const matchGridAxis = line.match(
        /#(\d+)=IFCGRIDAXIS\('([^']*(?:''[^']*)*)',#(\d+),(.+)\);/
      );
      if (matchGridAxis) {
        const pts = matchGridAxis[3];
        const recPuntLin = this.diccionarioIfc[Number(pts)];
        const polyline: any = await this.parsearLine('IFCPOLYLINE', recPuntLin);
        return {
          AxisTag: matchGridAxis[2],
          AxisCurve: polyline,
          SameSense: matchGridAxis[4].includes('T') ? true : false,
        };
      } else {
        console.warn('matchGridAxis', matchGridAxis);
        console.warn('IFCGRIDAXIS', line);
        return line;
      }
    } else if (tipo == 'IFCPOLYLINE') {
      const matchPolyline = line.match(/^#(\d+)=IFCPOLYLINE\(\(([^)]+)\)\);$/);
      if (matchPolyline) {
        const points = matchPolyline[2]
          .split(',#')
          .map((id) => parseInt(id.replace('#', ''), 10));
        if (points.length >= 2) {
          const Point1 = points[0];
          const Point2 = points[points.length - 1];
          const StartPoint: any = await this.parsearLine(
            'IFCCARTESIANPOINT',
            this.diccionarioIfc[Point1]
          );
          const Direction: any = await this.parsearLine(
            'IFCCARTESIANPOINT',
            this.diccionarioIfc[Point2]
          );
          return { StartPoint, Direction };
        } else {
          console.warn('puntos', matchPolyline);
          console.warn('IFCPOLYLINE', line);
          return line;
        }
      } else {
        console.warn('matchPolyline', matchPolyline);
        console.warn('IFCPOLYLINE', line);
        return line;
      }
    } else if (tipo == 'IFCDIRECTION') {
      const parts = line.split(/\(\(|,/);
      const matchDirection = parts.map((part) => part.replace(/[^0-9.-]/g, ''));
      if (matchDirection) {
        const x =
          matchDirection[1] === '0.' || matchDirection[1] === undefined
            ? 0
            : Number(matchDirection[1]);
        const y =
          matchDirection[2] === '0.' || matchDirection[2] === undefined
            ? 0
            : Number(matchDirection[2]);
        const z =
          matchDirection[3] === '0.' || matchDirection[3] === undefined
            ? 0
            : Number(matchDirection[3]);

        return { x, y, z };
      } else {
        console.warn('matchDirection', matchDirection);
        console.warn('IFCDIRECTION', line);
        return line;
      }
    } else {
      console.error('incorrecto match');
      console.error('line', line);
      return line;
    }
  }

  private addPointsAndLines2(objetos: any[]): void {
    let minZ = Infinity;
    let objetoConMinZ: any = null;
    let objetoEn0: any = null;
    const scaleFactor = this.unidadesGlobales.LENGTHUNIT == 'MILLI' ? 0.001 : 1;
    const material = new THREE.LineDashedMaterial({
      color: 0x000000, // Color de la línea
      dashSize: 0.01, // Longitud de los guiones
      gapSize: 0.01, // Longitud de los espacios
      linewidth: 1, // Grosor de la línea
    });
    let objetoConMasEjes = null;
    let maxEjes = -1;
    let location = null;

    objetos.forEach((objeto) => {
      const puntoUbicacion = new THREE.Vector3(
        objeto.ObjectPlacement.RelativePlacement.Location.x * scaleFactor,
        objeto.ObjectPlacement.RelativePlacement.Location.y * scaleFactor,
        objeto.ObjectPlacement.RelativePlacement.Location.z * scaleFactor
      );
      if (puntoUbicacion.z < minZ) {
        minZ = puntoUbicacion.z;
        // objetoConMinZ = objeto;
        location = objeto.ObjectPlacement.RelativePlacement.Location;
      }
      const totalEjes =
        (objeto.UAxes?.length || 0) +
        (objeto.VAxes?.length || 0) +
        (objeto.WAxes?.length || 0);
      if (totalEjes > maxEjes) {
        maxEjes = totalEjes;
        objetoConMinZ = objeto;
      }
    });

    if (objetoConMinZ) {
      const createLabel = (text: string, position: THREE.Vector3) => {
        const labelDiv = document.createElement('div');
        labelDiv.textContent = text;
        labelDiv.style.color = 'black';
        labelDiv.style.backgroundColor = '';
        labelDiv.style.padding = '2px';
        labelDiv.style.borderRadius = '5px';
        labelDiv.style.fontSize = '10px';
        labelDiv.style.position = 'absolute';
        labelDiv.style.fontWeight = 'bolder';
        const label = new CSS2DObject(labelDiv);
        label.element.removeAttribute('draggable');
        label.element.style.zIndex = '0';
        const labelPosition = position.clone();
        label.position.copy(labelPosition);
        this.world.scene.three.add(label);
        this.createdObjects.add(label);
      };

      let refDirection = null;
      let rotationMatrixRef = new THREE.Matrix4();
      if (
        objetoConMinZ.ObjectPlacement?.PlacementRelTo?.PlacementRelTo
          ?.RelativePlacement?.RefDirection
      ) {
        const refDirData =
          objetoConMinZ.ObjectPlacement.PlacementRelTo.PlacementRelTo
            .RelativePlacement.RefDirection;
        refDirection = new THREE.Vector3(
          refDirData.x,
          refDirData.y,
          refDirData.z
        ).normalize();

        const axisX = new THREE.Vector3(1, 0, 0); // Eje X de referencia
        const angle = refDirection.angleTo(axisX); // Ángulo entre RefDirection y el eje X
        const rotationAxis = new THREE.Vector3()
          .crossVectors(axisX, refDirection)
          .normalize(); // Eje de rotación

        rotationMatrixRef.makeRotationAxis(rotationAxis, angle);
      } else {
        console.warn(
          'RefDirection no existe en este objeto. Se usará una matriz identidad.'
        );
      }
      const coordinationMatrix = this.model.coordinationMatrix;
      const matrix = this.model.matrix;
      const matrixWorld = this.model.matrixWorld;

      const rotationMatrix = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
      location = location
        ? location
        : objetoConMinZ.ObjectPlacement.RelativePlacement.Location;
      const location2 =
        objetoConMinZ.ObjectPlacement?.PlacementRelTo?.PlacementRelTo
          ?.RelativePlacement?.Location;
      const locationVector = new THREE.Vector3(
        location.x,
        location.y,
        location.z
      );
      const locationVector2 = new THREE.Vector3();
      if (location2) {
        (locationVector2.x = location2.x),
          (locationVector2.y = location2.y),
          (locationVector2.z = location2.z);
      }
      const matrix1 = new THREE.Matrix4().makeTranslation(
        location.x,
        location.y,
        location.z
      );
      const matrix2 = new THREE.Matrix4().makeTranslation(
        location2.x,
        location2.y,
        location2.z
      );
      const addAxis = (axisList: any[], tag: string) => {
        axisList.forEach((eje: any) => {
          const startPoint = new THREE.Vector3(
            eje.AxisCurve.StartPoint.x,
            eje.AxisCurve.StartPoint.y,
            eje.AxisCurve.StartPoint.z
          )
            // .add(locationVector)
            // .add(locationVector2)
            .applyMatrix4(matrix2)
            .applyMatrix4(matrix1)

            .applyMatrix4(rotationMatrixRef)
            .applyMatrix4(rotationMatrix)
            .applyMatrix4(coordinationMatrix);

          const direction = new THREE.Vector3(
            eje.AxisCurve.Direction.x,
            eje.AxisCurve.Direction.y,
            eje.AxisCurve.Direction.z
          )
            // .add(locationVector)
            // .add(locationVector2)
            .applyMatrix4(matrix2)
            .applyMatrix4(matrix1)

            .applyMatrix4(rotationMatrixRef)
            .applyMatrix4(rotationMatrix)
            .applyMatrix4(coordinationMatrix);

          const geometry = new THREE.BufferGeometry().setFromPoints([
            startPoint,
            direction,
          ]);
          const line = new THREE.Line(geometry, material);
          line.computeLineDistances();
          this.world.scene.three.add(line);
          this.createdObjects.add(line);

          createLabel(eje.AxisTag, startPoint.clone());
          createLabel(eje.AxisTag, direction.clone());
        });
      };

      if (objetoConMinZ.UAxes) addAxis(objetoConMinZ.UAxes, 'UAxis');
      if (objetoConMinZ.VAxes) addAxis(objetoConMinZ.VAxes, 'VAxis');
      if (objetoConMinZ.WAxes) addAxis(objetoConMinZ.WAxes, 'WAxis');

      // objetoConMinZ.UAxes?.forEach((eje: any) => {
      //   const startPoint = new THREE.Vector3(
      //     eje.AxisCurve.StartPoint.x,
      //     eje.AxisCurve.StartPoint.y,
      //     eje.AxisCurve.StartPoint.z
      //   )
      //     .add(locationVector)
      //     .applyMatrix4(rotationMatrixRef)
      //     .applyMatrix4(rotationMatrix)
      //     .applyMatrix4(coordinationMatrix);
      //   const direction = new THREE.Vector3(
      //     eje.AxisCurve.Direction.x,
      //     eje.AxisCurve.Direction.y,
      //     eje.AxisCurve.Direction.z
      //   )
      //     .add(locationVector)
      //     .applyMatrix4(rotationMatrixRef)
      //     .applyMatrix4(rotationMatrix)
      //     .applyMatrix4(coordinationMatrix);
      //   // const endPoint = new THREE.Vector3().addVectors(startPoint, direction);
      //   const geometry = new THREE.BufferGeometry().setFromPoints([
      //     startPoint,
      //     direction,
      //   ]);
      //   const lineUAxis = new THREE.Line(geometry, material);
      //   lineUAxis.computeLineDistances();
      //   this.world.scene.three.add(lineUAxis);
      //   this.createdObjects.add(lineUAxis);
      //   createLabel(eje.AxisTag, startPoint.clone()); // Etiqueta en puntoA
      //   createLabel(eje.AxisTag, direction.clone()); // Etiqueta en puntoB
      // });
      // objetoConMinZ.VAxes?.forEach((eje: any) => {
      //   const startPoint = new THREE.Vector3(
      //     eje.AxisCurve.StartPoint.x,
      //     eje.AxisCurve.StartPoint.y,
      //     eje.AxisCurve.StartPoint.z
      //   )
      //     .add(locationVector)
      //     .applyMatrix4(rotationMatrixRef)
      //     .applyMatrix4(rotationMatrix)
      //     .applyMatrix4(coordinationMatrix);
      //   const direction = new THREE.Vector3(
      //     eje.AxisCurve.Direction.x,
      //     eje.AxisCurve.Direction.y,
      //     eje.AxisCurve.Direction.z
      //   )
      //     .add(locationVector)
      //     .applyMatrix4(rotationMatrixRef)
      //     .applyMatrix4(rotationMatrix)
      //     .applyMatrix4(coordinationMatrix);
      //   // const endPoint = new THREE.Vector3().addVectors(startPoint, direction);
      //   const geometry = new THREE.BufferGeometry().setFromPoints([
      //     startPoint,
      //     direction,
      //   ]);
      //   const lineUAxis = new THREE.Line(geometry, material);
      //   lineUAxis.computeLineDistances();
      //   this.world.scene.three.add(lineUAxis);
      //   this.createdObjects.add(lineUAxis);
      //   createLabel(eje.AxisTag, startPoint.clone()); // Etiqueta en puntoA
      //   createLabel(eje.AxisTag, direction.clone()); // Etiqueta en puntoB
      // });
      // objetoConMinZ.WAxes?.forEach((eje: any) => {
      //   const startPoint = new THREE.Vector3(
      //     eje.AxisCurve.StartPoint.x,
      //     eje.AxisCurve.StartPoint.y,
      //     eje.AxisCurve.StartPoint.z
      //   )
      //     .add(locationVector)
      //     .applyMatrix4(rotationMatrixRef)
      //     .applyMatrix4(rotationMatrix)
      //     .applyMatrix4(coordinationMatrix);
      //   const direction = new THREE.Vector3(
      //     eje.AxisCurve.Direction.x,
      //     eje.AxisCurve.Direction.y,
      //     eje.AxisCurve.Direction.z
      //   )
      //     .add(locationVector)
      //     .applyMatrix4(rotationMatrixRef)
      //     .applyMatrix4(rotationMatrix)
      //     .applyMatrix4(coordinationMatrix);
      //   // const endPoint = new THREE.Vector3().addVectors(startPoint, direction);
      //   const geometry = new THREE.BufferGeometry().setFromPoints([
      //     startPoint,
      //     direction,
      //   ]);
      //   const lineUAxis = new THREE.Line(geometry, material);
      //   lineUAxis.computeLineDistances();
      //   this.world.scene.three.add(lineUAxis);
      //   this.createdObjects.add(lineUAxis);
      //   createLabel(eje.AxisTag, startPoint.clone()); // Etiqueta en puntoA
      //   createLabel(eje.AxisTag, direction.clone()); // Etiqueta en puntoB
      // });
    } else {
      this._snackBar.open('No existe eje en 0', '', {
        duration: 4000,
        panelClass: ['celeste-snack-bar'],
      });
      return;
    }
  }

  private clearObjects(): void {
    this.createdObjects.forEach((object) => {
      if (object instanceof CSS2DObject) {
        // Eliminar el label de la escena
        this.world.scene.three.remove(object);
        // Eliminar el elemento del DOM
        if (object.element.parentElement) {
          object.element.parentElement.removeChild(object.element);
        }
      } else if (object instanceof THREE.Line) {
        // Eliminar la línea de la escena
        this.world.scene.three.remove(object);
      }
    });

    // Limpiar la lista de objetos creados
    this.createdObjects.clear();
  }

  async visibilidadEjes() {
    this.verEjes = !this.verEjes;
    if (this.verEjes) {
      if (
        Object.keys(this.diccionarioIfc).length == 0 &&
        !this.arrayLineas.length
      ) {
        this.loading = true;
        setTimeout(async () => {
          const objPuntos = await this.extractCartesianPoints(this.textContDoc);
          // this.puntosCartesianos = objPuntos;
          this.diccionarioIfc = objPuntos;

          await this.renderizarLineas();
          if (this.arrayLineas.length) {
            await this.addPointsAndLines2(this.arrayLineas);
          } else {
            this._snackBar.open('El documento no contiene eje', '', {
              duration: 4000,
              panelClass: ['celeste-snack-bar'],
            });
          }
          this.loading = false;
        }, 0);
      } else {
        if (this.arrayLineas.length) {
          await this.addPointsAndLines2(this.arrayLineas);
        } else {
          this._snackBar.open('El documento no contiene eje', '', {
            duration: 4000,
            panelClass: ['celeste-snack-bar'],
          });
        }
      }
    } else {
      this.clearObjects();
    }
  }

  async processFile(file: File) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = new Uint8Array(e.target?.result as ArrayBuffer);
      await this.processModelFromBuffer(buffer, file);
    };
    reader.readAsArrayBuffer(file);
  }

  async processModelFromBuffer(buffer: Uint8Array, file: File) {
    try {
      if (this.container) {
        this.limpiarVariables();
        if (this.container) {
          while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
          }
        }
        await this.processText(file);
        const components = new OBC.Components();
        const fragmentIfcLoader = components.get(OBC.IfcLoader);
        fragmentIfcLoader.settings.excludedCategories.add(3856911033);

        const worlds = components.get(OBC.Worlds);
        // const world = worlds.create<
        //   OBC.SimpleScene,
        //   OBC.SimpleCamera,
        //   OBCF.PostproductionRenderer
        // >();
        let world = worlds.create<
          OBC.SimpleScene,
          OBC.SimpleCamera,
          OBCF.RendererWith2D
        >();
        world.scene = new OBC.SimpleScene(components);
        // world.renderer = new OBCF.PostproductionRenderer(
        //   components,
        //   this.container
        // );
        world.renderer = new OBCF.RendererWith2D(components, this.container);
        world.camera = new OBC.SimpleCamera(components);

        components.init();
        // world.camera.controls.setLookAt(
        //   -1.0198054354798272,
        //   3.545293038971296,
        //   31.53745535058005,
        //   0,
        //   0,
        //   -10
        // );
        world.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);

        // world.renderer.postproduction.enabled = true;
        world.scene.setup();

        const grids = components.get(OBC.Grids);
        const grid = grids.create(world);
        const color = new THREE.Color(0xa7abc4); //color fondo de grafico
        world.scene.three.background = color;
        grid.config.visible = this.verGrid;
        const colorRejas = new THREE.Color(0x474747);
        grid.config.color = colorRejas;
        grid.config.primarySize = 5;
        grid.config.secondarySize = 10;
        this.grid = grid;
        // world.renderer.postproduction.customEffects.excludedMeshes.push(
        //   grid.three
        // );

        await fragmentIfcLoader.setup();
        fragmentIfcLoader.settings.wasm = {
          path: 'https://cdn.jsdelivr.net/npm/web-ifc@0.0.66/',
          absolute: true,
          logLevel: WEBIFC.LogLevel.LOG_LEVEL_OFF,
        };
        const model: any = await fragmentIfcLoader.load(buffer);
        this.buscando = false;
        this.buscando2 = true;
        const indexer = components.get(OBC.IfcRelationsIndexer);
        if (model.hasProperties) {
          const arraycompleto: any = model.getLocalProperties();
          await indexer.process(model);
          const encontrado: any = await Object.values(arraycompleto).find(
            (ele: any) => ele.type == 103090709
          );

          const gridKeys = Object.keys(arraycompleto).filter(
            (key) => arraycompleto[key].type === 3009204131
          ); // 3009204131  IfcGrid | 852622518 ifcgridAxis
          this.gridsKeys = gridKeys;

          const lista = await indexer.getEntityChildren(
            model,
            encontrado.expressID
          );
          if (arraycompleto !== undefined && lista) {
            let filteredEntities: any[] = [];
            lista.forEach((ele) => filteredEntities.push(arraycompleto[ele]));
            this.arrayCompleto = arraycompleto;
            this.filteredEntities = filteredEntities;
            this.crearTabla2(filteredEntities, arraycompleto, indexer, model);
          }
        }
        for (const child of model.children) {
          if (child instanceof THREE.Mesh) {
            world.meshes.add(child);
          }
        }

        await world.scene.three.add(model);
        const highlighter = components.get(OBCF.Highlighter);
        highlighter.clear();
        // highlighter.dispose();
        highlighter.setup({ world: world });
        const fragments = model.children;
        this.items = model.items;
        this.arrFragments = model.children;

        this.indexer = indexer;
        this.model = model;

        this.world = world;
        if (this.world.renderer) {
          this.renderer = this.world.renderer.three;
        }
        highlighter.events['select']?.onHighlight.add(async (fragmentIdMap) => {
          if (
            this.filPres !== null &&
            this.mostrarPrevPlant &&
            this.tablaGenerada.length
          ) {
            this.buscarTablaGene(fragmentIdMap);
          }
          if (!this.visible4) {
            if (this.verVolumen) {
              const volume = this.volumen.getVolumeFromFragments(fragmentIdMap);
            }

            if (!this.isCtrlPressed) {
              this.buscar(fragmentIdMap);
              this.selectedFragments = fragmentIdMap;
            } else {
              this.acumularMapas(fragmentIdMap);
            }
          } else {
            if (this.capturarVolumen) {
              this.highlightVol = fragmentIdMap;
            }
          }
        });
        highlighter.events['select']?.onClear.add(() => {
          if (this.verVolumen && !this.visible4) {
            this.volumen.clear();
          }
          if (this.capturarVolumen && this.visible4) {
            this.highlightVol = {};
          }
          this.selectedFragments = {};
          this.multAcumulados = {};
          this.filTabGenerada = [];
          if (this.ultResTabGen) {
            this.classifier.resetColor(this.ultResTabGen);
            this.ultResTabGen = null;
          }
        });
        const hoverColor = new THREE.Color(0x5a3994); // color hover
        const selectColor = new THREE.Color(0xe6f34a); // color selecccionado
        highlighter.colors.set('hover', hoverColor);
        highlighter.colors.set('select', selectColor);
        this.highlighter = highlighter;

        this.highlighter.zoomFactor = 1;
        this.components = components;
        this.volumen = components.get(OBCF.VolumeMeasurement);
        this.volumen.world = world;
        this.volumen.enabled = false;
        this.dimensions = components.get(OBCF.EdgeMeasurement);
        this.dimensions.world = world;
        this.dimensions.enabled = false;
        this.area = components.get(OBCF.AreaMeasurement);
        this.area.world = world;
        this.area.enabled = false;
        // highlighter.zoomToSelection = true;
        highlighter.multiple = 'ctrlKey';

        this.face = components.get(OBCF.FaceMeasurement);

        this.face.world = world;
        this.face.enabled = false;
        this.classifier = components.get(OBC.Classifier);

        this.casters = components.get(OBC.Raycasters);
        this.casters.get(world);
        this.clipper = components.get(OBC.Clipper);
        this.clipper.enabled = false;

        this.edges = components.get(OBCF.ClipEdges);
        this.clipper.Type = OBCF.EdgesPlane;
        this.clipper.material.color.set('#000000');
        this.clipper.material.opacity = 0.1;
        this.clipper.size = 5;
        this.clipperColor = {
          colorHex: '#000000', // Valor inicial en formato hexadecimal
          material: {
            color: new THREE.Color('#000000'), // Inicializa con el mismo valor
          },
        };

        this.marker = components.get(OBCF.Marker);
        this.marker.color = 'black';
        this.renderer.render(this.world.scene.three, this.world.camera.three);
        this.longitud = components.get(OBCF.LengthMeasurement);
        this.longitud.world = world;
        this.longitud.enabled = false;
        this.longitud.snapDistance = 1;
        this.longitud.color.set('#000000');
        // const customAxes = await this.createCustomAxes(100, 2); // Longitud: 100, Grosor: 2
        // world.scene.three.add(customAxes);

        const unidades = Object.keys(this.arrayCompleto).filter(
          (key) => this.arrayCompleto[key].type === 448429030
        );
        let unidadesGlobales: any = {};
        for (const element of unidades) {
          const obj = this.arrayCompleto[Number(element)];
          unidadesGlobales[obj.UnitType.value] = obj.Name.value;
        }
        this.unidadesGlobales = unidadesGlobales;
      }
    } catch (e) {
      console.log(e);
      this.confirm();
    }
  }

  // Función para crear ejes personalizados
  async createCustomAxes(length = 10, thickness = 0.1) {
    const axesGroup = new THREE.Group();

    // Colores para los ejes (X: rojo, Y: verde, Z: azul)
    const colors = [0xff0000, 0x00ff00, 0x0000ff];
    const axisLabels = ['X', 'Y', 'Z'];

    // Crear ejes X, Y, Z
    for (let i = 0; i < 3; i++) {
      // Crear la línea del eje
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3().setComponent(i, length),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: colors[i],
        linewidth: thickness,
      });
      const line = new THREE.Line(geometry, material);
      axesGroup.add(line);

      // Crear etiqueta para el eje
      const labelTexture = await this.createLabelTexture2(
        axisLabels[i],
        colors[i]
      );
      const spriteMaterial = new THREE.SpriteMaterial({ map: labelTexture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(...points[1].toArray()); // Posición de la etiqueta al final del eje
      sprite.scale.set(2, 1, 1); // Escala de la etiqueta
      axesGroup.add(sprite);
    }

    return axesGroup;
  }

  // Función para crear una textura de etiqueta
  async createLabelTexture2(text: any, color = 0xffffff) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const textureSize = 128; // Tamaño de la textura

    canvas.width = textureSize;
    canvas.height = textureSize;

    if (context) {
      context.fillStyle = `rgb(${color >> 16}, ${(color >> 8) & 0xff}, ${
        color & 0xff
      })`;
      context.font = '24px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, textureSize / 2, textureSize / 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  habilitarClipper() {
    this.verClipper = !this.verClipper;
    this.clipper.enabled = this.verClipper;
    if (this.container) {
      if (this.verClipper) {
        this.container.ondblclick = () => {
          if (this.clipper.enabled) {
            this.clipper.create(this.world);
          }
        };
      } else {
        // this.clipper.delete(this.world);

        // this.clipper.config.visible = false;
        this.clipper?.deleteAll();
        // this.clipper.dispose()
      }
      this.highlighter.enabled = true;
      // this.verificarActHighlighter();
    }
  }

  colorFondo(colorHex: any) {
    if (colorHex === 'gradient') {
      this.setGradientBackground();
    } else {
      const color = new THREE.Color(colorHex);
      this.world.scene.three.background = color; // Asigna un color sólido
    }
  }

  setGradientBackground() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Crear un gradiente lineal de celeste a blanco (de arriba hacia abajo)
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#87CEEB'); // Celeste en la parte superior
      gradient.addColorStop(1, '#FFFFFF'); // Blanco en la parte inferior

      // Rellenar el canvas con el gradiente
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Crear la textura a partir del canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Asignar la textura como fondo
    this.world.scene.three.background = texture;
  }

  zoomSeleccionado() {
    this.zoomSelected = !this.zoomSelected;
    this.highlighter.zoomToSelection = this.zoomSelected;
  }

  async restaurarCamara() {
    this.world.camera.controls.setLookAt(
      -1.0198054354798272,
      3.545293038971296,
      31.53745535058005,
      0,
      0,
      -10
    );
  }

  filtrarMeshesxID(id: any) {}

  verBounding(map: any) {
    let volumen;

    volumen = this.volumen.getVolumeFromFragments(map);
    if (!this.verVolumen) {
      this.volumen.clear();
    }

    const boundingBoxer = this.components.get(OBC.BoundingBoxer);
    boundingBoxer.addFragmentIdMap(map);

    const boundingBox = boundingBoxer.get();
    const ff = boundingBoxer.getMesh();
    const x = boundingBox.max.x - boundingBox.min.x;
    const y = boundingBox.max.y - boundingBox.min.y;
    const z = boundingBox.max.z - boundingBox.min.z;
    const AreaTotal = 2 * (x * y + x * z + y * z);
    const a = x * y;
    const b = x * z;
    const c = y * z;
    const AreaMaxima = Math.max(a, b, c);
    const Thickness = Math.min(x, y, z);
    const dataGeometrica = {
      boundingboxlength: this.consulta.redondeo(x, 3),
      boundingboxwidth: this.consulta.redondeo(y, 3),
      boundingboxheight: this.consulta.redondeo(z, 3),
      volumen: this.consulta.redondeo(volumen, 3),
      AreaTotal: this.consulta.redondeo(AreaTotal, 3),
      AreaMaxima: this.consulta.redondeo(AreaMaxima, 3),
      Thickness: this.consulta.redondeo(Thickness, 3),
    };
    boundingBoxer.reset();

    // if (this.container) {
    //   // const selectedElement = OBC.com;

    //   this.face.selection = [];
    //   this.face.enabled = true;
    //   this.face.create();
    //   const a = this.face.get();

    //   this.face?.deleteAll();
    // }
    return dataGeometrica;
  }

  acumularMapas(fragmentMap: any) {
    const addToSet = (uuid: string, value: any) => {
      if (value instanceof Set) {
        value.forEach((val) => addToSet(uuid, val));
      } else {
        if (!this.multAcumulados[uuid]) {
          this.multAcumulados[uuid] = new Set();
        }
        this.multAcumulados[uuid].add(value);
      }
    };

    Object.entries(fragmentMap).forEach(([uuid, value]: [string, any]) => {
      addToSet(uuid, value);
    });
    // this.highlighter.highlightByID('select', this.multAcumulados, true);
  }

  verGridGrafico() {
    this.verGrid = !this.verGrid;
    this.grid.config.visible = this.verGrid;
  }

  async crearTabla2(
    filtrados: any,
    arrayCompleto: any,
    indexer: any,
    model: any
  ) {
    try {
      let proyecto: any[] = [];
      this.allTypes = [];
      let elementosIndividuales = 0;
      const superiores = filtrados.filter(
        (ele: any) =>
          ele.type == 103090709 ||
          ele.type == 4097777520 ||
          ele.type == 4031249490
      );

      if (superiores.length) {
        superiores.forEach((ele: any, index: number) => {
          if (ele.type == 103090709) {
            this.codigoDocumento = ele.GlobalId.value;
            for (const key in this.clavedocColors) {
              if (this.clavedocColors.hasOwnProperty(key)) {
                if (this.codigoDocumento == key) {
                  this.colorDocumento = this.clavedocColors[key];
                }
              }
            }
            if (!this.colorDocumento && this.codigoDocumento) {
              const color = this.coloresBasicosHex.pop();
              if (color) {
                this.clavedocColors[this.codigoDocumento] = color;
                this.colorDocumento = color;
              }
            }
          }
          const dataPiso: Elemento = {
            active: false,
            clase: ele.type,
            claseTraducida: '',
            ind: null,
            informacion: ele,
            mostrar: true,
            nivel: index,
            visible: true,
            propiedades: [],
            vinculos: [],
            vinculado: false,
            nroIncluidos: 0,
          };
          proyecto.push(dataPiso);
        });
      }
      const pisos = filtrados.filter((ele: any) => ele.type == 3124254112);
      for (const element of pisos) {
        const dataPiso: Elemento = {
          active: true,
          clase: element.type,
          claseTraducida: '',
          ind: null,
          informacion: element,
          mostrar: true,
          nivel: 3,
          visible: true,
          propiedades: [],
          vinculos: [],
          vinculado: false,
          nroIncluidos: 0,
        };
        proyecto.push(dataPiso);
        const indexTit = proyecto.length - 1;
        let piso: any[] = [];
        const encontrados = indexer.getEntityChildren(model, element.expressID);
        encontrados.forEach((ele: any) => {
          piso.push(arrayCompleto[ele]);
        });
        let groupedData: any = {};
        let result: any[] = [];
        let eliminar: any[] = [];
        if (piso.length) {
          this.allTypes = this.allTypes.concat(piso.slice(1));
          let cant = 0;

          piso.forEach((item, index) => {
            if (index > 0) {
              if (item.type !== 3856911033) {
                if (!groupedData[item.type]) {
                  groupedData[item.type] = [];
                  cant++;
                }
                const obj: Elemento = {
                  active: false,
                  clase: item.type,
                  claseTraducida: '',
                  ind: null,
                  informacion: item,
                  mostrar: false,
                  nivel: 5,
                  visible: true,
                  propiedades: [],
                  vinculos: [],
                  vinculado: false,
                  nroIncluidos: 0,
                };
                groupedData[item.type].push(obj);
              } else {
                const obj: Elemento = {
                  active: false,
                  clase: item.type,
                  claseTraducida: '',
                  ind: null,
                  informacion: item,
                  mostrar: false,
                  nivel: 5,
                  visible: true,
                  propiedades: [],
                  vinculos: [],
                  vinculado: false,
                  nroIncluidos: 0,
                };
                eliminar.push(obj);
              }
            }
          });
          proyecto[indexTit].nroIncluidos = cant;
          for (const type in groupedData) {
            if (type !== '979691226') {
              let grupos: any = {};
              if (groupedData[type].length > 1) {
                grupos = groupedData[type].reduce((acc: any, elemento: any) => {
                  const key = elemento.informacion?.ObjectType?.value
                    ? elemento.informacion?.ObjectType?.value
                    : elemento.informacion?.Name?.value
                    ? elemento.informacion?.Name?.value?.split(':')[0].trim()
                    : '';

                  if (!acc[key]) {
                    acc[key] = [];
                  }
                  acc[key].push(elemento);
                  return acc;
                }, {} as Record<string, Elemento[]>);
              }

              const nombresGrupos: any = Object.keys(grupos);

              if (nombresGrupos.length > 1) {
                for (const elem in grupos) {
                  const obj: Elemento = {
                    active: false,
                    clase: Number(type),
                    claseTraducida: elem,
                    ind: null,
                    informacion: null,
                    mostrar: false,
                    nivel: 4,
                    visible: true,
                    propiedades: [],
                    vinculos: [],
                    vinculado: false,
                    nroIncluidos: grupos[elem].length,
                  };
                  elementosIndividuales =
                    elementosIndividuales + grupos[elem].length;
                  result.push(obj);
                  result.push(...grupos[elem]);
                }
              } else {
                const obj: Elemento = {
                  active: false,
                  clase: Number(type),
                  claseTraducida: '',
                  ind: null,
                  informacion: null,
                  mostrar: false,
                  nivel: 4,
                  visible: true,
                  propiedades: [],
                  vinculos: [],
                  vinculado: false,
                  nroIncluidos: groupedData[type].length,
                };
                elementosIndividuales =
                  elementosIndividuales + groupedData[type].length;
                result.push(obj);
                result.push(...groupedData[type]);
              }
            } else {
              function contarDosPuntos(cadena: string): number {
                return cadena.split(':').length - 1;
              }
              let grupos: any = {};
              grupos = groupedData[type].reduce((acc: any, elemento: any) => {
                const key = elemento.informacion.Name.value
                  .split(':')[2]
                  .trim();

                if (!acc[key]) {
                  acc[key] = [];
                }
                acc[key].push(elemento);
                return acc;
              }, {} as Record<string, Elemento[]>);
              let acerosCant = 0;
              for (const elem in grupos) {
                const obj: Elemento = {
                  active: false,
                  clase: Number(type),
                  claseTraducida: '(Acero)' + elem,
                  ind: null,
                  informacion: null,
                  mostrar: false,
                  nivel: 4,
                  visible: true,
                  propiedades: [],
                  vinculos: [],
                  vinculado: false,
                  nroIncluidos: grupos[elem].length,
                };
                elementosIndividuales =
                  elementosIndividuales + grupos[elem].length;
                result.push(obj);
                acerosCant++;
                result.push(...grupos[elem]);
              }
              proyecto[indexTit].nroIncluidos =
                proyecto[indexTit].nroIncluidos - 1 + acerosCant;
              // const obj: Elemento = {
              //   active: false,
              //   clase: Number(type),
              //   claseTraducida: '',
              //   ind: null,
              //   informacion: null,
              //   mostrar: false,
              //   nivel: 4,
              //   visible: true,
              //   propiedades: [],
              //   vinculos: [],
              //   vinculado: false,
              //   nroIncluidos: groupedData[type].length,
              // };
              // elementosIndividuales =
              //   elementosIndividuales + groupedData[type].length;
              // result.push(obj);
              // result.push(...groupedData[type]);
            }
          }
        }
        proyecto = proyecto.concat(result);
      }

      const diccionarioType: { [key: number]: string[] } = {
        103090709: ['IfcProject', 'Proyecto', 'Proyecto'],
        4097777520: ['IfcSite', 'Sitio', 'Sitio'],
        4031249490: ['IfcBuilding', 'Edificio', 'Edificio'],
        3124254112: [
          'IfcBuildingStorey',
          'Nivel de Edificio',
          'Nivel de Edificio',
        ],
        1674181508: ['IfcAnnotation', 'Anotacion', 'Anotaciones'],
        3009204131: ['IfcGrid', 'Ejes', 'Rejillas'],
        843113511: ['IfcColumn', 'Pilar', 'Pilares'],
        1529196076: ['IfcSlab', 'Forjado', 'Losas'],
        3495092785: ['IfcCurtainWall', 'Muro entramado', 'Muros Entramados'],
        3171933400: ['IfcPlate', 'Panel', 'Paneles'],
        2223149337: [
          'IfcFlowTerminal',
          'Terminal de Flujo',
          'Terminales de flujos',
        ],
        263784265: [
          'IfcFurnishingElement',
          'Elemento de Mobiliario',
          'Muebles',
        ],
        3512223829: ['IfcWallStandardCase', 'Muro Estandar', 'Muros Estandar'],
        395920057: ['IfcDoor', 'Puerta', 'Puertas'],
        2391406946: ['IfcWall', 'Pared', 'Paredes'],
        753842376: ['IfcBeam', 'Viga', 'Vigas'],
        1073191201: ['IfcBeam', 'Viga', 'Vigas'],
        979691226: ['IfcSteel', 'Acero', 'Aceros'],
        1095909175: [
          'IfcBuildingElementProxy',
          'Elemento constructivo indeterminado(Proxy)',
          'Elementos constructivos indeterminados(Proxies)',
        ],
        331165859: ['IfcStair', 'Escalera', 'Escaleras'],
        4252922144: [
          'IfcStairFlight',
          'Tramo de escalera',
          'Tramos de escaleras',
        ],
        3304561284: ['IfcWindow', 'Ventana', 'Ventanas'],
        2262370178: ['IfcRailing', 'Pasamanos', 'Barandillas'],
        1973544240: ['IfcCovering', 'Revestimiento', 'Revestimientos'],
        2016517767: ['IfcRoof', 'Cubierta', 'Cubiertas'],
      };

      proyecto.forEach((ele, index) => {
        ele.ind = index;
        if (ele.nivel == 0) {
          ele.nroIncluidos = elementosIndividuales;
        }
        if (!ele.claseTraducida) {
          if (diccionarioType.hasOwnProperty(ele.clase)) {
            if (ele.nivel <= 4) {
              ele.claseTraducida = diccionarioType[ele.clase][2]
                ? diccionarioType[ele.clase][2]
                : ele.clase;
            } else {
              ele.claseTraducida = diccionarioType[ele.clase][1]
                ? diccionarioType[ele.clase][1]
                : ele.clase;
            }
            ele.clase = diccionarioType[ele.clase][0]
              ? diccionarioType[ele.clase][0]
              : ele.clase;
          } else {
            ele.claseTraducida = ele.clase;
            ele.clase = ele.clase;
          }
        }
        if (ele.informacion?.GlobalId?.value) {
          this.arrGlobalsIds[ele.informacion.GlobalId.value] = ele;
        }
        if (ele.informacion) {
          this.expresIdInd[ele.informacion.expressID] = index;
        }
      });
      this.buscando2 = false;
      this.dataIFC = proyecto;
    } catch (e) {
      console.log(e);
    }
  }

  verBarrasDimensiones() {
    this.verDimensiones = !this.verDimensiones;
    this.dimensions.enabled = this.verDimensiones;
    if (this.dimensions.enabled) {
      if (this.container) {
        this.container.ondblclick = () => {
          const creado = this.dimensions.create();
        };
      }
    } else {
      this.dimensions?.deleteAll();
      // this.dimensions.dispose()
    }
    this.verificarActHighlighter();
  }

  crearSegmentosArea() {
    this.area.enabled = this.capturarArea;
    if (this.area.enabled) {
      if (this.container) {
        this.container.ondblclick = () => this.area.create();
        this.container.oncontextmenu = () => this.area.endCreation();
      }
    } else {
      this.area?.deleteAll();
      // this.area.dispose()
    }
    // this.verificarActHighlighter();
  }

  crearSegmentosLongitud() {
    this.longitud.enabled = this.capturarLongitud;
    if (this.longitud.enabled) {
      if (this.container) {
        this.container.ondblclick = () => this.longitud.create();
        // this.container.oncontextmenu = () => this.longitud.endCreation();
      }
    } else {
      // this.longitud?.deleteAll();
      // this.area.dispose()
    }
    // this.verificarActHighlighter();
  }

  verVisualVolumenes() {
    this.verVolumen = !this.verVolumen;
    this.volumen.enabled = this.verVolumen;
    if (this.container) {
      if (this.verVolumen) {
        // this.container.onclick = () => this.volumen.create();
        this.highlighter.enabled = false;
      } else {
        this.volumen?.deleteAll();
        // this.volumen.dispose()
      }
      this.verificarActHighlighter();
    }
  }

  verificarActHighlighter() {
    if (this.verDimensiones || this.verClipper) {
      this.highlighter.enabled = false;
      this.highlighter.clear();
      this.multAcumulados = {};
    } else {
      this.highlighter.enabled = true;
      this.highlighter.clear();
      this.multAcumulados = {};
      this.area?.deleteAll();
      // this.area.dispose()
      this.dimensions?.deleteAll();
      // this.dimensions.dispose()
      this.volumen?.deleteAll();
      // this.volumen.dispose()
      this.face?.deleteAll();
      // this.face.dispose()
      this.clipper?.deleteAll();
      // this.clipper.dispose()
      this.longitud?.deleteAll();
    }
  }

  async seleccionRow(row: any, index: number, anteriores = false) {
    this.infoSeleccionado = row;
    this.dataGeometrica = {};
    if (index == this.filaSel && !anteriores) {
      this.nivel = '';
      return;
    }

    let proyecto = '';
    let nivel = '';
    for (let i = index; i >= 0; i--) {
      const element = this.dataIFC[i];
      if (element.nivel == 0 && !proyecto) {
        proyecto = element.informacion?.Name?.value;
        break;
      } else if (element.nivel == 3 && !nivel) {
        nivel = element.informacion?.Name?.value;
      }
    }

    this.dataIFC[index].mostrar = true;
    this.guid = proyecto;
    this.nivel = nivel;
    this.filaSel = row.ind;
    this.multAcumulados = {};
    if (row.informacion && row.nivel > 4) {
      const fragmentMap = await this.busquedaFragmentos(
        row.informacion.expressID
      );
      if (Object.keys(fragmentMap).length !== 0) {
        this.noCargarData = true;
        this.highlighter.highlightByID('select', fragmentMap, true);
      }
    } else {
      function addToSet(uuid: string, value: any) {
        if (value instanceof Set) {
          value.forEach((val) => addToSet(uuid, val));
        } else {
          concatenado[uuid].add(value);
        }
      }
      const concatenado: any = {};
      for (let i = row.ind + 1; i < this.dataIFC.length; i++) {
        const element = this.dataIFC[i];
        if (element.nivel > row.nivel) {
          if (element.informacion && element.nivel > 4) {
            const fragmentMap = await this.busquedaFragmentos(
              element.informacion.expressID
            );

            if (fragmentMap) {
              Object.entries(fragmentMap).forEach(
                ([uuid, value]: [string, any]) => {
                  if (!concatenado[uuid]) {
                    concatenado[uuid] = new Set();
                  }
                  addToSet(uuid, value);
                }
              );
            }
          }
        } else {
          break;
        }
      }
      if (Object.keys(concatenado).length !== 0) {
        this.noCargarData = true;
        this.highlighter.highlightByID('select', concatenado, true);
        this.multAcumulados = concatenado;
      } else {
        this.highlighter.clear();
      }
    }

    if (anteriores) {
      await this.antOcultos(index);
      setTimeout(() => {
        const filasVisibles = this.dataIFC.filter((r) => r.mostrar);
        const indexVisible = filasVisibles.findIndex((r) => r === row);
        if (indexVisible >= 0 && this.filas) {
          const filasArray = this.filas.toArray();
          const fila = filasArray[indexVisible];

          if (fila) {
            fila.nativeElement.focus();
          }
        }
      }, 100);
    }
  }

  async busquedaFragmentos(idExpress: any) {
    const encontrados: any[] = this.items.filter((ele: any) =>
      ele.ids.has(idExpress)
    );
    let fragmentIdMap: any = {};
    if (encontrados.length) {
      for (const element of encontrados) {
        let idUnico = element.ids;
        if (element.ids.has(idExpress)) {
          idUnico = new Set([idExpress]);
        }
        fragmentIdMap[element.id] = idUnico;
      }
    }
    return fragmentIdMap;
  }

  async parseIfcLine(line: string) {
    const cleanedLine = line.replace(/[\r\n]+/g, '').trim();
    const split1 = cleanedLine.split('=');
    const id = split1[0].replace('#', '');
    const startIdx = split1[1].indexOf('(');
    const endIdx = split1[1].lastIndexOf(')');
    const entityType = split1[1].substring(0, startIdx).trim();
    const attributes = split1[1].substring(startIdx, endIdx + 1).trim();
    const attributeArray = attributes.split(',').map((attr) => {
      attr = attr.replace(/[(#)]/g, '').trim();
      if (!attr || attr === '$') {
        return null;
      } else {
        return parseInt(attr);
      }
    });
    const entity = {
      id,
      entityType,
      attributeArray,
    };
    return entity;
  }

  toggleRow(index: number, accion: boolean) {
    const seleccionado = this.dataIFC[index];
    this.dataIFC[index].active = !this.dataIFC[index].active;
    for (let i = index + 1; i < this.dataIFC.length; i++) {
      let element = this.dataIFC[i];
      if (seleccionado.nivel < element.nivel) {
        if (!accion) {
          element.active = accion;
          element.mostrar = accion;
        } else {
          if (seleccionado.nivel + 1 == element.nivel) {
            element.active = accion;
            element.mostrar = accion;
          } else {
            element.active = false;
          }
        }
      } else {
        break;
      }
    }
  }

  toggleNavbar() {
    this.mostrarNavbar = !this.mostrarNavbar;
  }

  async hiderRow(row: any, event: any, index: number) {
    const hider = this.components.get(OBC.Hider);
    let fragmentMap: any;
    if (row.nivel > 4) {
      this.dataIFC[row.ind].visible = event.target.checked;
      fragmentMap = await this.busquedaFragmentos(row.informacion.expressID);
    } else {
      function addToSet(uuid: string, value: any) {
        if (value instanceof Set) {
          value.forEach((val) => addToSet(uuid, val));
        } else {
          concatenado[uuid].add(value);
        }
      }
      const concatenado: any = {};
      for (let i = index + 1; i < this.dataIFC.length; i++) {
        const element = this.dataIFC[i];
        if (element.nivel > row.nivel) {
          this.dataIFC[i].visible = event.target.checked;
          if (element.informacion) {
            fragmentMap = await this.busquedaFragmentos(
              element.informacion.expressID
            );
            if (fragmentMap) {
              Object.entries(fragmentMap).forEach(
                ([uuid, value]: [string, any]) => {
                  if (!concatenado[uuid]) {
                    concatenado[uuid] = new Set();
                  }
                  addToSet(uuid, value);
                }
              );
            }
          }
        } else {
          break;
        }
      }
      fragmentMap = concatenado;
    }
    hider.set(event.target.checked, fragmentMap);
  }

  cambioTabla() {
    this.restaurarGrafico();
    if (this.tipoTabla == 1) {
      this.buscando2 = true;
      const diccionarioType: { [key: number]: string[] } = {
        103090709: ['IfcProject', 'Proyecto', 'Proyecto'],
        4097777520: ['IfcSite', 'Sitio', 'Sitio'],
        4031249490: ['IfcBuilding', 'Edificio', 'Edificio'],
        3124254112: [
          'IfcBuildingStorey',
          'Piso de Edificio',
          'Piso de Edificio',
        ],
        1674181508: ['IfcAnnotation', 'Anotacion', 'Anotaciones'],
        3009204131: ['IfcGrid', 'Ejes', 'Rejillas'],
        843113511: ['IfcColumn', 'Pilar', 'Pilares'],
        1529196076: ['IfcSlab', 'Forjado', 'Losas'],
        3495092785: ['IfcCurtainWall', 'Muro entramado', 'Muros Entramados'],
        3171933400: ['IfcPlate', 'Panel', 'Paneles'],
        2223149337: [
          'IfcFlowTerminal',
          'Terminal de Flujo',
          'Terminales de flujos',
        ],
        263784265: [
          'IfcFurnishingElement',
          'Elemento de Mobiliario',
          'Muebles',
        ],
        3512223829: ['IfcWallStandardCase', 'Muro Estandar', 'Muros Estandar'],
        395920057: ['IfcDoor', 'Puerta', 'Puertas'],
        2391406946: ['IfcWall', 'Pared', 'Paredes'],
        753842376: ['IfcBeam', 'Viga', 'Vigas'],
        1095909175: [
          'IfcBuildingElementProxy',
          'Elemento constructivo indeterminado(Proxy)',
          'Elementos constructivos indeterminados(Proxies)',
        ],
        331165859: ['IfcStair', 'Escalera', 'Escaleras'],
        4252922144: [
          'IfcStairFlight',
          'Tramo de escalera',
          'Tramos de escaleras',
        ],
        3304561284: ['IfcWindow', 'Ventana', 'Ventanas'],
        2262370178: ['IfcRailing', 'Pasamanos', 'Barandillas'],
        1973544240: ['IfcCovering', 'Revestimiento', 'Revestimientos'],
        2016517767: ['IfcRoof', 'Cubierta', 'Cubiertas'],
      };
      let tabla: any[] = [];
      const groupedItems = this.allTypes.reduce((acc, item) => {
        if (!acc[item.type]) {
          acc[item.type] = [];
        }
        acc[item.type].push(item);
        return acc;
      }, {});
      let i = 0;
      for (let ele in groupedItems) {
        const clase = diccionarioType[Number(ele)];
        const arr = groupedItems[Number(ele)];
        if (arr.length) {
          const obj: Elemento = {
            active: true,
            clase: Number(ele),
            claseTraducida: clase[2],
            ind: i,
            informacion: '',
            mostrar: true,
            nivel: 4,
            visible: true,
            propiedades: [],
            vinculos: [],
            vinculado: false,
            nroIncluidos: 0,
          };
          tabla.push(obj);
          i++;
          for (const element of arr) {
            const obj2: Elemento = {
              active: true,
              clase: Number(ele),
              claseTraducida: clase[1],
              ind: i,
              informacion: element,
              mostrar: false,
              nivel: 5,
              visible: false,
              propiedades: [],
              vinculos: [],
              vinculado: false,
              nroIncluidos: 0,
            };
            tabla.push(obj2);
            i++;
          }
        }
      }
      this.tablaGrupos = tabla;
      this.buscando2 = false;
    }
  }

  seleccionRow2(row: Elemento, index: number) {}

  toggleRow2(index: number, accion: boolean) {
    const seleccionado = this.tablaGrupos[index];
    this.tablaGrupos[index].active = !this.tablaGrupos[index].active;

    for (let i = index + 1; i < this.tablaGrupos.length; i++) {
      let element = this.tablaGrupos[i];
      if (seleccionado.nivel < element.nivel) {
        if (!accion) {
          element.active = accion;
          element.mostrar = accion;
        } else {
          if (seleccionado.nivel + 1 == element.nivel) {
            element.active = accion;
            element.mostrar = accion;
          } else {
            element.active = false;
          }
        }
      } else {
        break;
      }
    }
  }

  async restaurarGrafico() {
    const hider = this.components.get(OBC.Hider);
    const concatenado: any = {};
    let filtrados: any = [];
    if (!this.tipoTabla) {
      this.tablaGrupos.map((ele, ind) => {
        if (!ele.visible && ele.nivel > 4) {
          filtrados.push(ele);
        }
        this.tablaGrupos[ind].visible = true;
      });
      this.dataIFC.forEach((ele) => (ele.visible = true));
    } else {
      this.dataIFC.map((ele, ind) => {
        if (!ele.visible && ele.nivel > 4) {
          filtrados.push(ele);
        }
        this.dataIFC[ind].visible = true;
      });
      this.tablaGrupos.forEach((ele) => (ele.visible = true));
    }
    await filtrados.map(async (element: any) => {
      if (element.informacion) {
        const fragmentMap = await this.busquedaFragmentos(
          element.informacion.expressID
        );
        if (fragmentMap) {
          Object.entries(fragmentMap).map((uuid: any) => {
            concatenado[uuid[0]] = uuid[1];
          });
        }
      }
    });
    if (Object.keys(concatenado).length > 0) {
      hider.set(true, concatenado);
    }
    console.table(this.tablaGrupos);
    console.table(this.dataIFC);
  }

  async hiderRow2(row: any, event: any, index: number) {
    const hider = this.components.get(OBC.Hider);
    const concatenado: any = {};
    if (row == null) {
      await this.tablaGrupos.map(async (ele, ind) => {
        if (ele.nivel > 4) {
          if (ele.informacion) {
            const fragmentMap = await this.busquedaFragmentos(
              ele.informacion.expressID
            );
            if (fragmentMap) {
              Object.entries(fragmentMap).map((uuid: any) => {
                concatenado[uuid[0]] = uuid[1];
              });
            }
          }
        }
        this.tablaGrupos[ind].visible = event.target.checked;
      });
    } else {
      for (let i = index + 1; i < this.tablaGrupos.length; i++) {
        const element = this.tablaGrupos[i];
        if (element.nivel > row.nivel) {
          if (element.informacion) {
            const fragmentMap = await this.busquedaFragmentos(
              element.informacion.expressID
            );
            if (fragmentMap) {
              Object.entries(fragmentMap).map((uuid: any) => {
                concatenado[uuid[0]] = uuid[1];
              });
            }
          }
          this.tablaGrupos[i].visible = event.target.checked;
        } else {
          break;
        }
      }
    }
    if (Object.keys(concatenado).length > 0) {
      hider.set(event.target.checked, concatenado);
    }
  }

  limpiarVariables() {
    this.dataIFC = [];
    this.tablaGrupos = [];
    this.allTypes = [];
    this.infoSeleccionado = null;
    this.filaSel = null;
    this.arrayCompleto = [];
    this.verDimensiones = false;
    this.verVolumen = false;
    this.guid = '';
    this.nivel = '';
    this.arrFragments = [];
    this.items = [];
    this.tab = 0;
    this.dataGeometrica = {};
    this.vinculoActivado = false;
    this.searchText = '';
    this.multAcumulados = [];
    this.codigoDocumento = null;
    this.filPres = null;
    this.multPres = false;
    this.paso = 0;
    this.visible = false;
    this.visible2 = false;
    this.filSelVinc = null;
    this.gruposVisibles = [];
    this.dataGrupoSel = null;
    this.ultimaCelda = null;
    this.visible3 = false;
    this.verGrid = false;
    this.arrGlobalsIds = [];
    this.ultimoVincResl = null;
    this.maximizarPlant = false;
    this.colorDocumento = '';
    this.expresIdInd = {};
    this.formulaManual = '';
    this.formula = '';
    this.gridsKeys = [];
    this.puntosCartesianos = [];
    this.createdObjects = new Set();
    this.verEjes = false;
    this.verClipper = false;
    this.arrayLineas = [];
    this.unidadesGlobales = {};
    this.diccionarioIfc = {};
    this.verColEjes = false;
    this.verColDetalle = false;
    this.filTabGenerada = [];
    this.ultResTabGen = null;
  }

  // async guardarVinculos(datos: any, toaster = true) {
  //   const datos1 = JSON.stringify(datos);
  //   const datos2 = JSON.stringify([]);
  //   const obj = JSON.stringify({
  //     id_proyecto: this.id_proyecto,
  //     id_usuario: this.id_usuario,
  //     datos1: datos1,
  //     datos2: datos2
  //   });
  //   const response = await this.consulta.guardarMetradoIfc(obj);
  //   if (response.id == '1') {
  //     if (toaster) {
  //       this.messageService.add({
  //         severity: 'success',
  //         summary: 'Correcto',
  //         detail: 'Se guardó correctamente',
  //       });
  //     }
  //   } else {
  //     this.messageService.add({
  //       severity: 'error',
  //       summary: 'Error',
  //       detail: 'No se pudo vincular',
  //     });
  //   }
  // }

  async convertirDetalle(datos: any) {
    const datos2 = await datos.map((ele: any) => {
      if (ele.fragmentId instanceof Set) {
        ele.fragmentId = JSON.stringify(Array.from(ele.fragmentId));
      } else if (ele.fragmentId && typeof ele.fragmentId === 'object') {
        const keys = Object.keys(ele.fragmentId);
        keys.forEach((key) => {
          if (ele.fragmentId[key] instanceof Set) {
            ele.fragmentId[key] = Array.from(ele.fragmentId[key]);
          }
        });
        ele.fragmentId = JSON.stringify(ele.fragmentId);
      } else {
        ele.fragmentId = '';
      }
      return ele;
    });
    return datos2;
  }

  async guardarDetalle(datos: any, indice2: any, toaster = true, filPres: any) {
    const datos2 = await datos.map((ele: any) => {
      if (ele.fragmentId instanceof Set) {
        ele.fragmentId = JSON.stringify(Array.from(ele.fragmentId));
      } else if (ele.fragmentId && typeof ele.fragmentId === 'object') {
        const keys = Object.keys(ele.fragmentId);
        keys.forEach((key) => {
          if (ele.fragmentId[key] instanceof Set) {
            ele.fragmentId[key] = Array.from(ele.fragmentId[key]);
          }
        });
        ele.fragmentId = JSON.stringify(ele.fragmentId);
      } else {
        ele.fragmentId = '';
      }
      return ele;
    });
    const datos1 = JSON.stringify(datos2);
    const id_proyecto = JSON.stringify(this.id_proyecto);
    const indice = JSON.stringify(indice2);
    const obj = JSON.stringify({
      id_proyecto: id_proyecto,
      indice: indice,
      datos1: datos1,
    });
    const response: any = await lastValueFrom(
      this.consulta.guardarDetalleMetradoIfc(obj)
    );

    if (response.id == '1') {
      const datosArray: any[] = [];

      datos2.forEach((elemento: any) => {
        if (elemento.fragmentId !== '') {
          try {
            const parsedFragmentId = JSON.parse(elemento.fragmentId);
            if (Array.isArray(parsedFragmentId)) {
              elemento.fragmentId = new Set(parsedFragmentId);
            } else if (
              parsedFragmentId &&
              typeof parsedFragmentId === 'object'
            ) {
              for (const key in parsedFragmentId) {
                if (Array.isArray(parsedFragmentId[key])) {
                  parsedFragmentId[key] = new Set(parsedFragmentId[key]);
                }
              }
              elemento.fragmentId = parsedFragmentId;
            }
            datosArray.push(elemento);
          } catch (error) {
            console.error('Error al parsear JSON:', error);
            datosArray.push({ ...elemento, fragmentId: null });
          }
        } else {
          datosArray.push(elemento);
        }
      });
      this.tablaDetalles[filPres] = datosArray;
      this.tablaGenerada = datosArray;
      if (toaster) {
        this.messageService.add({
          severity: 'success',
          summary: 'Correcto',
          detail: 'Se guardó correctamente',
        });
      }
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo vincular',
      });
    }
  }

  verVinculados(row: any) {
    let valido = true;
    if (row.clavedoc && row.clavedoc !== this.codigoDocumento) {
      valido = false;
    }
    this.listaVinculados = [];
    this.filaResum = null;

    if (row.vinculos) {
      const arr: any = row.vinculos.split('|');
      for (const element of arr) {
        if (!this.arrGlobalsIds[element]) {
          valido = false;
          break;
        }
        this.listaVinculados.push(this.arrGlobalsIds[element]);
      }
    }
    if (!valido) {
      this.confirmationService.confirm({
        message: 'vinculos con otro documento ,Desea reiniciar los vinculos de la partida ?',
        header: 'Eliminar vinculos',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          if (this.filPres !== null) {
            this.loading = true;
            this.visible = false;
            this.tablaMetrado[this.filPres].vinculos = '';
            this.tablaMetrado[this.filPres].nombredoc = '';
            this.tablaMetrado[this.filPres].clavedoc = '';
            this.tablaMetrado[this.filPres].color = '';
            this.tablaMetrado[this.filPres].plantilla = '';
            this.tablaDetalles[this.filPres] = [];
            this.tablaGenerada = [];
            await this.guardarCambios([this.filPres]);
            const index = JSON.parse(JSON.stringify(this.filPres));
            this.filPres = null;
            await this.selFilTabMetr(this.tablaMetrado[index], index);
            this.loading = false;
          }
        },
        reject: () => {
          // Reject action
        },
      });
    } else {
      this.visible = true;
    }
  }

  onCheckboxClick() {
    if (
      this.filPres == null ||
      (this.filPres !== null && !this.tablaMetrado[this.filPres].unidad)
    ) {
      const msj =
        this.filPres == null
          ? 'Ninguna partida  seleccionada en metrado presupuesto '
          : 'La fila seleccionada no es partida';
      this._snackBar.open(msj, '', {
        duration: 3000,
        panelClass: ['error-snack-bar'],
      });
      return;
    } else {
      if (
        this.tablaMetrado[this.filPres].clavedoc &&
        this.tablaMetrado[this.filPres].clavedoc !== this.codigoDocumento
      ) {
        this._snackBar.open('Partida con vinculos de otro documento', '', {
          duration: 3000,
          panelClass: ['error-snack-bar'],
        });
        return;
      }
    }
  }

  habMultiple() {
    if (this.filPres == null) {
      this._snackBar.open(
        'Ninguna fila seleccionada en metrado presupuesto ',
        '',
        {
          duration: 3000,
          panelClass: ['error-snack-bar'],
        }
      );
      return;
    } else if (!this.tablaMetrado[this.filPres].unidad) {
      this._snackBar.open('La fila seleccionada no es partida', '', {
        duration: 3000,
        panelClass: ['error-snack-bar'],
      });
      return;
    }
    this.multPres = !this.multPres;
  }

  async selFilTabMetr(row: any, i: any) {
    if (i == this.filPres) {
      return;
    }

    if (!row.clavedoc || row.clavedoc == this.codigoDocumento) {
      this.bloqVincPartid = false;
    } else {
      this.bloqVincPartid = true;
    }
    this.gruposKeys = [];
    this.gruposGlobalIds = [];
    this.selectGrupos = [];
    this.verColEjes = false;
    this.verColDetalle = false;
    this.filTabGenerada = [];
    // await this.limpiarVinculados();
    await this.restaurarColoresOriginales();
    this.cerradoModalFormMan();
    this.gruposVinc = {};
    this.tablaPlantilla = [];
    this.mostrarPrevPlant = false;
    this.tablaGenerada = [];
    this.totalPartida = 0;
    this.highlighter.clear();
    this.filaPlantilla = null;
    this.visible = false;
    this.visible2 = false;
    this.filSelVinc = null;
    this.gruposVisibles = [];
    this.dataGrupoSel = null;
    this.ultimaCelda = null;
    this.visible4 = false;
    this.filPres = i;
    this.dataIFC = this.dataIFC.map((elemento) => ({
      ...elemento,
      vinculado: false,
    }));

    if (
      this.filPres !== null &&
      this.tablaMetrado[this.filPres].vinculos &&
      this.tablaMetrado[this.filPres].clavedoc == this.codigoDocumento
    ) {
      const arr = this.tablaMetrado[this.filPres].vinculos.split('|');
      for (const element of arr) {
        // console.log('element', element)
        const filaIfc = this.arrGlobalsIds[element];
        // console.log('filaIfc', filaIfc)
        this.dataIFC[filaIfc.ind].vinculado = true;
      }
      await this.resaltarVinculados(arr);
    }
    if (this.filPres !== null) {
      if (
        this.tablaMetrado[this.filPres].plantilla &&
        (this.tablaMetrado[this.filPres].clavedoc == this.codigoDocumento ||
          !this.tablaMetrado[this.filPres].clavedoc)
      ) {
        const arr = this.tablaMetrado[this.filPres].plantilla;
        const filas = arr.split('@');
        const arrTablaPlant = filas.map((fila: any) => fila.split('|'));
        const array = await this.completarArray(arrTablaPlant, 10);
        this.crearTablaPlantilla2(array);
      } else {
        const array = await this.completarArray([], 10);
        this.crearTablaPlantilla2(array);
      }
      let vinculados = [];

      this.verColEjes =
        this.tablaMetrado[this.filPres].ejeactivo == 1 ? true : false;
      this.verColDetalle =
        this.tablaMetrado[this.filPres].detaactivo == 1 ? true : false;
      if (
        row.vinculos &&
        this.tablaMetrado[this.filPres].clavedoc == this.codigoDocumento
      ) {
        const arr: any = row.vinculos.split('|');
        for (const element of arr) {
          vinculados.push(this.arrGlobalsIds[element]);
        }
        const agruparPorCategoria = vinculados.reduce((acc, item) => {
          if (!acc[item.informacion?.ObjectType?.value]) {
            acc[item.informacion.ObjectType.value] = [];
          }
          acc[item.informacion?.ObjectType?.value].push(item);
          return acc;
        }, {});
        this.gruposVinc = agruparPorCategoria;
        this.gruposKeys = Object.keys(agruparPorCategoria);
        for (const element in agruparPorCategoria) {
          let globalIdsArr = [];
          for (const ele of agruparPorCategoria[element]) {
            globalIdsArr.push(ele.informacion.GlobalId.value);
          }
          this.gruposGlobalIds.push(globalIdsArr);
        }
        this.selectGrupos = this.gruposKeys.map((_, index) => `G${index + 1}`); // Crear array de G1, G2, G3, ...
        this.selectGrupos.unshift('M');
        // this.selectGrupos.unshift('');
        this.gruposKeys.map((ele) => this.gruposVisibles.push(false));
      }

      // if (
      //   this.mostrarPrevPlant &&
      //   this.tablaMetrado[this.filPres].clavedoc == this.codigoDocumento
      // ) {
      //   this.verPrevDatPlantilla(false);
      // }

      if (!row.vinculos) {
        this.selectGrupos.unshift('M');
        // this.selectGrupos.unshift('');
      }
      this.tablaGenerada = this.tablaDetalles[this.filPres];
    }
  }

  mostrarVinculados(index: any, vinculadosPartida: any) {
    const hider = this.components.get(OBC.Hider);
    hider.set(true, vinculadosPartida);
  }

  ocultarVinculadosFila(vinculadosPartida: any) {
    const hider = this.components.get(OBC.Hider);
    hider.set(true, vinculadosPartida);
  }

  verificarValido(index: number, celda: string) {
    let valido = true;

    return valido;
  }

  async resaltarVinculados(vinculados: any) {
    function addToSet(uuid: string, value: any) {
      if (value instanceof Set) {
        value.forEach((val) => addToSet(uuid, val));
      } else {
        concatenado[uuid].add(value);
      }
    }
    const concatenado: any = {};
    for (const element of vinculados) {
      const filaIfc = this.arrGlobalsIds[element];
      if (filaIfc) {
        const fragmentMap = await this.busquedaFragmentos(
          filaIfc.informacion.expressID
        );

        if (fragmentMap) {
          Object.entries(fragmentMap).forEach(
            ([uuid, value]: [string, any]) => {
              if (!concatenado[uuid]) {
                concatenado[uuid] = new Set();
              }
              addToSet(uuid, value);
            }
          );
        }
      }
    }
    if (Object.keys(concatenado).length !== 0) {
      // this.mostrarVinculados(this.filPres,concatenado)
      await this.marcarVinculados(concatenado);
    }
  }

  async todaLaFamiliaNiv() {
    if (Object.keys(this.multAcumulados).length > 0) {
      const concatenado: any = {};
      function addToSet(uuid: string, value: any) {
        if (value instanceof Set) {
          value.forEach((val) => addToSet(uuid, val));
        } else {
          concatenado[uuid].add(value);
        }
      }
      for (const key in this.multAcumulados) {
        const element = this.multAcumulados[key];
        const [valor] = [...element];
        const info = this.arrayCompleto[valor];
        const indice = this.expresIdInd[valor];
        const fragmentMap = await this.busquedaFragmentos(info.expressID);
        if (fragmentMap) {
          Object.entries(fragmentMap).forEach(
            ([uuid, value]: [string, any]) => {
              if (!concatenado[uuid]) {
                concatenado[uuid] = new Set();
              }
              addToSet(uuid, value);
            }
          );
        }
        if (indice !== undefined) {
          if (this.dataIFC[indice].informacion === info) {
            if (indice < this.dataIFC.length - 1) {
              for (let i = indice + 1; i < this.dataIFC.length; i++) {
                const row = this.dataIFC[i];
                if (row.nivel < 5) {
                  break;
                } else {
                  if (info.type == row.informacion?.type) {
                    const fragmentMap = await this.busquedaFragmentos(
                      row.informacion.expressID
                    );
                    if (fragmentMap) {
                      Object.entries(fragmentMap).forEach(
                        ([uuid, value]: [string, any]) => {
                          if (!concatenado[uuid]) {
                            concatenado[uuid] = new Set();
                          }
                          addToSet(uuid, value);
                        }
                      );
                    }
                  }
                }
              }

              for (let i = indice - 1; i >= 0; i--) {
                const row = this.dataIFC[i];
                if (row.nivel < 5) {
                  break;
                } else {
                  if (info.type == row.informacion?.type) {
                    const fragmentMap = await this.busquedaFragmentos(
                      row.informacion.expressID
                    );
                    if (fragmentMap) {
                      Object.entries(fragmentMap).forEach(
                        ([uuid, value]: [string, any]) => {
                          if (!concatenado[uuid]) {
                            concatenado[uuid] = new Set();
                          }
                          addToSet(uuid, value);
                        }
                      );
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (Object.keys(concatenado).length !== 0) {
        this.noCargarData = true;
        this.highlighter.highlightByID('select', concatenado, true);
        this.multAcumulados = concatenado;
        this.infoSeleccionado = null;
        this.filaSel = null;
      } else {
      }
    } else if (
      Object.keys(this.multAcumulados).length == 1 ||
      Object.keys(this.selectedFragments).length == 1
    ) {
      let eleBuscar: any = null;
      const multAcumulados: any = Object.keys(this.multAcumulados)[0]
        ? Object.keys(this.multAcumulados)[0]
        : this.selectedFragments;
      const key = Object.keys(multAcumulados)[0];
      const element = multAcumulados[key];
      const [valor] = [...element];
      const info = this.arrayCompleto[valor];
      const indice = this.expresIdInd[valor];
      this.infoSeleccionado = this.dataIFC[indice];
      for (let i = indice - 1; i >= 0; i--) {
        const element = this.dataIFC[i];
        if (element.nivel < this.infoSeleccionado.nivel) {
          eleBuscar = element;
          break;
        }
      }
      if (eleBuscar !== null) {
        this.seleccionRow(eleBuscar, eleBuscar.ind, true);
      }
    } else {
      this._snackBar.open('Ningun elemento seleccionado', '', {
        duration: 2000,
        panelClass: ['error-snack-bar'],
      });
      return;
    }
  }

  async todoElTipoNiv() {
    if (
      Object.keys(this.multAcumulados).length > 0 ||
      Object.keys(this.selectedFragments).length > 0
    ) {
      const concatenado: any = {};
      function addToSet(uuid: string, value: any) {
        if (value instanceof Set) {
          value.forEach((val) => addToSet(uuid, val));
        } else {
          concatenado[uuid].add(value);
        }
      }
      const multAcumulados =
        Object.keys(this.multAcumulados).length > 0
          ? this.multAcumulados
          : this.selectedFragments;
      for (const key in multAcumulados) {
        const element = multAcumulados[key];
        const [valor] = [...element];
        const info = this.arrayCompleto[valor];
        const indice = this.expresIdInd[valor];
        const fragmentMap = await this.busquedaFragmentos(info.expressID);
        if (fragmentMap) {
          Object.entries(fragmentMap).forEach(
            ([uuid, value]: [string, any]) => {
              if (!concatenado[uuid]) {
                concatenado[uuid] = new Set();
              }
              addToSet(uuid, value);
            }
          );
        }
        if (indice !== undefined) {
          if (this.dataIFC[indice].informacion === info) {
            if (indice < this.dataIFC.length - 1) {
              for (let i = indice + 1; i < this.dataIFC.length; i++) {
                const row = this.dataIFC[i];
                if (row.nivel < 4) {
                  break;
                } else {
                  if (row.informacion && info.type == row.informacion?.type) {
                    const fragmentMap = await this.busquedaFragmentos(
                      row.informacion.expressID
                    );
                    if (fragmentMap) {
                      Object.entries(fragmentMap).forEach(
                        ([uuid, value]: [string, any]) => {
                          if (!concatenado[uuid]) {
                            concatenado[uuid] = new Set();
                          }
                          addToSet(uuid, value);
                        }
                      );
                    }
                  }
                }
              }

              for (let i = indice - 1; i >= 0; i--) {
                const row = this.dataIFC[i];
                if (row.nivel < 4) {
                  break;
                } else {
                  if (row.informacion && info.type == row.informacion?.type) {
                    const fragmentMap = await this.busquedaFragmentos(
                      row.informacion.expressID
                    );
                    if (fragmentMap) {
                      Object.entries(fragmentMap).forEach(
                        ([uuid, value]: [string, any]) => {
                          if (!concatenado[uuid]) {
                            concatenado[uuid] = new Set();
                          }
                          addToSet(uuid, value);
                        }
                      );
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (Object.keys(concatenado).length !== 0) {
        this.noCargarData = true;
        this.highlighter.highlightByID('select', concatenado, true);
        this.multAcumulados = concatenado;
        this.infoSeleccionado = null;
        this.filaSel = null;
      } else {
      }
    } else {
      this._snackBar.open('Ningun elemento seleccionado', '', {
        duration: 2000,
        panelClass: ['error-snack-bar'],
      });
      return;
    }
  }

  todoTipoProy() {
    if (
      Object.keys(this.multAcumulados).length > 0 ||
      Object.keys(this.selectedFragments).length > 0
    ) {
      this.classifier.byEntity(this.model);
      this.classifier.byIfcRel(
        this.model,
        WEBIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE,
        'storeys'
      );
      this.classifier.byModel(this.model.uuid, this.model);
      const concatenado: any = {};
      function addToSet(uuid: string, value: any) {
        if (value instanceof Set) {
          value.forEach((val) => addToSet(uuid, val));
        } else {
          concatenado[uuid].add(value);
        }
      }
      const multAcumulados =
        Object.keys(this.multAcumulados).length > 0
          ? this.multAcumulados
          : this.selectedFragments;

      for (const key in multAcumulados) {
        const element = multAcumulados[key];
        const [valor] = [...element];
        const indice = this.expresIdInd[valor];
        const infoSeleccionado = this.dataIFC[indice];
        const classBusqueda = infoSeleccionado.clase.toString().toUpperCase();
        const fragmentMap = this.classifier.find({
          entities: [classBusqueda],
        });
        if (fragmentMap) {
          Object.entries(fragmentMap).forEach(
            ([uuid, value]: [string, any]) => {
              if (!concatenado[uuid]) {
                concatenado[uuid] = new Set();
              }
              addToSet(uuid, value);
            }
          );
        }
      }

      if (Object.keys(concatenado).length !== 0) {
        this.noCargarData = true;
        this.highlighter.highlightByID('select', concatenado, true);
        this.multAcumulados = concatenado;
        this.infoSeleccionado = null;
        this.filaSel = null;
      }
    } else {
      this._snackBar.open('Ningun elemento seleccionado', '', {
        duration: 2000,
        panelClass: ['error-snack-bar'],
      });
      return;
    }
  }

  async todoElPiso() {
    if (
      Object.keys(this.multAcumulados).length > 0 ||
      Object.keys(this.selectedFragments).length > 0
    ) {
      const concatenado: any = {};
      function addToSet(uuid: string, value: any) {
        if (value instanceof Set) {
          value.forEach((val) => addToSet(uuid, val));
        } else {
          concatenado[uuid].add(value);
        }
      }
      const niveles = this.dataIFC
        .map((element, index) => (element.nivel === 3 ? index : -1)) // Asignamos -1 si no es nivel 3
        .filter((index) => index !== -1);
      const grupos: any = [];
      for (let i = 0; i < niveles.length; i++) {
        const start = niveles[i];
        const end =
          i + 1 < niveles.length ? niveles[i + 1] - 1 : this.dataIFC.length - 1; // El siguiente índice de inicio - 1 es el fin
        const considerar = false;
        grupos.push({ start, end, considerar });
      }

      let indicesFiltrar: any = [];
      const multAcumulados =
        Object.keys(this.multAcumulados).length > 0
          ? this.multAcumulados
          : this.selectedFragments;

      for (const key in multAcumulados) {
        const element = multAcumulados[key];
        const [valor] = [...element];
        const indice = this.expresIdInd[valor];
        indicesFiltrar.push(indice);
      }

      for (const grupo of grupos) {
        for (const index of indicesFiltrar) {
          if (index >= grupo.start && index <= grupo.end) {
            grupo.considerar = true;
          }
        }
      }

      const indicesUnicos = grupos.filter((ele: any) => ele.considerar);
      for (const grupo of indicesUnicos) {
        for (let i = grupo.start; i <= grupo.end; i++) {
          const row = this.dataIFC[i];
          if (row.informacion) {
            const fragmentMap = await this.busquedaFragmentos(
              row.informacion.expressID
            );
            if (fragmentMap) {
              Object.entries(fragmentMap).forEach(
                ([uuid, value]: [string, any]) => {
                  if (!concatenado[uuid]) {
                    concatenado[uuid] = new Set();
                  }
                  addToSet(uuid, value);
                }
              );
            }
          }
        }
      }
      if (Object.keys(concatenado).length !== 0) {
        this.noCargarData = true;
        this.highlighter.highlightByID('select', concatenado, true);
        this.multAcumulados = concatenado;
        this.infoSeleccionado = null;
        this.filaSel = null;
      }
    } else {
      this._snackBar.open('Ningun elemento seleccionado', '', {
        duration: 2000,
        panelClass: ['error-snack-bar'],
      });
      return;
    }
  }

  async ocultarElNivelSel() {
    if (Object.keys(this.multAcumulados).length > 0) {
      const concatenado: any = {};
      function addToSet(uuid: string, value: any) {
        if (value instanceof Set) {
          value.forEach((val) => addToSet(uuid, val));
        } else {
          concatenado[uuid].add(value);
        }
      }
      for (const key in this.multAcumulados) {
        const element = this.multAcumulados[key];
        const [valor] = [...element];
        const info = this.arrayCompleto[valor];
        const indice = this.expresIdInd[valor];
        const fragmentMap = await this.busquedaFragmentos(info.expressID);
        if (fragmentMap) {
          Object.entries(fragmentMap).forEach(
            ([uuid, value]: [string, any]) => {
              if (!concatenado[uuid]) {
                concatenado[uuid] = new Set();
              }
              addToSet(uuid, value);
            }
          );
        }
        if (indice !== undefined) {
          if (this.dataIFC[indice].informacion === info) {
            if (indice < this.dataIFC.length - 1) {
              for (let i = indice + 1; i < this.dataIFC.length; i++) {
                const row = this.dataIFC[i];
                if (row.nivel < 5) {
                  break;
                } else {
                  if (info.type == row.informacion?.type) {
                    const fragmentMap = await this.busquedaFragmentos(
                      row.informacion.expressID
                    );
                    this.dataIFC[i].visible = false;
                    if (fragmentMap) {
                      Object.entries(fragmentMap).forEach(
                        ([uuid, value]: [string, any]) => {
                          if (!concatenado[uuid]) {
                            concatenado[uuid] = new Set();
                          }
                          addToSet(uuid, value);
                        }
                      );
                    }
                  }
                }
              }

              for (let i = indice - 1; i >= 0; i--) {
                const row = this.dataIFC[i];
                if (row.nivel < 5) {
                  break;
                } else {
                  if (info.type == row.informacion?.type) {
                    const fragmentMap = await this.busquedaFragmentos(
                      row.informacion.expressID
                    );
                    if (fragmentMap) {
                      this.dataIFC[i].visible = false;
                      Object.entries(fragmentMap).forEach(
                        ([uuid, value]: [string, any]) => {
                          if (!concatenado[uuid]) {
                            concatenado[uuid] = new Set();
                          }
                          addToSet(uuid, value);
                        }
                      );
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (Object.keys(concatenado).length !== 0) {
        this.noCargarData = true;
        const hider = this.components.get(OBC.Hider);
        hider.set(false, concatenado);
        this.multAcumulados = {};
        this.infoSeleccionado = null;
        this.filaSel = null;
        this.highlighter.clear();
      } else {
      }
    } else if (
      Object.keys(this.multAcumulados).length == 1 ||
      Object.keys(this.selectedFragments).length == 1
    ) {
      let eleBuscar: any = null;
      const multAcumulados: any = Object.keys(this.multAcumulados)[0]
        ? Object.keys(this.multAcumulados)[0]
        : this.selectedFragments;
      const key = Object.keys(multAcumulados)[0];
      const element = multAcumulados[key];
      const [valor] = [...element];
      const info = this.arrayCompleto[valor];
      const indice = this.expresIdInd[valor];
      this.infoSeleccionado = this.dataIFC[indice];
      for (let i = indice - 1; i >= 0; i--) {
        const element = this.dataIFC[i];
        if (element.nivel < this.infoSeleccionado.nivel) {
          eleBuscar = element;
          break;
        }
      }
      if (eleBuscar !== null) {
        const fakeEvent = {
          target: {
            checked: false,
          },
        };
        fakeEvent.target.checked = false;
        await this.hiderRow(eleBuscar, fakeEvent, eleBuscar.ind);
        this.filaSel = null;
        this.infoSeleccionado = null;
        this.highlighter.clear();
      }
    } else {
      this._snackBar.open('Ningun elemento seleccionado', '', {
        duration: 2000,
        panelClass: ['error-snack-bar'],
      });
      return;
    }
  }

  async ocultarTipoSel() {
    // if (this.filaSel !== null) {
    //   const classBusqueda = this.infoSeleccionado.clase;
    //   for (let i = 0; i < this.dataIFC.length; i++) {
    //     const element: any = this.dataIFC[i];
    //     if (element.nivel == 4 && element.clase == classBusqueda) {
    //       this.dataIFC[i].visible = false;
    //       const fakeEvent = {
    //         target: {
    //           checked: false,
    //         },
    //       };
    //       fakeEvent.target.checked = false;
    //       await this.hiderRow(element, fakeEvent, element.ind);
    //     }
    //   }
    //   this.filaSel = null;
    //   this.infoSeleccionado = null;
    //   this.multAcumulados = {};
    //   this.highlighter.clear();
    // } else {
    //   this._snackBar.open('Ningun elemento seleccionado', '', {
    //     duration: 2000,
    //     panelClass: ['error-snack-bar'],
    //   });
    //   return;
    // }
    if (
      Object.keys(this.multAcumulados).length > 0 ||
      Object.keys(this.selectedFragments).length > 0
    ) {
      this.classifier.byEntity(this.model);
      this.classifier.byIfcRel(
        this.model,
        WEBIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE,
        'storeys'
      );
      this.classifier.byModel(this.model.uuid, this.model);
      const concatenado: any = {};
      function addToSet(uuid: string, value: any) {
        if (value instanceof Set) {
          value.forEach((val) => addToSet(uuid, val));
        } else {
          concatenado[uuid].add(value);
        }
      }
      const multAcumulados =
        Object.keys(this.multAcumulados).length > 0
          ? this.multAcumulados
          : this.selectedFragments;

      for (const key in multAcumulados) {
        const element = multAcumulados[key];
        const [valor] = [...element];
        const indice = this.expresIdInd[valor];
        const infoSeleccionado = this.dataIFC[indice];
        const classBusqueda = infoSeleccionado.clase.toString().toUpperCase();
        const fragmentMap = this.classifier.find({
          entities: [classBusqueda],
        });
        if (fragmentMap) {
          Object.entries(fragmentMap).forEach(
            ([uuid, value]: [string, any]) => {
              if (!concatenado[uuid]) {
                concatenado[uuid] = new Set();
              }
              addToSet(uuid, value);
            }
          );
        }
      }

      if (Object.keys(concatenado).length !== 0) {
        // this.noCargarData = true;
        const hider = this.components.get(OBC.Hider);
        hider.set(false, concatenado);
        this.multAcumulados = {};
        this.infoSeleccionado = null;
        this.filaSel = null;
        this.highlighter.clear();
      }
    } else {
      this._snackBar.open('Ningun elemento seleccionado', '', {
        duration: 2000,
        panelClass: ['error-snack-bar'],
      });
      return;
    }
  }

  ocultarNoSelec() {
    if (
      Object.keys(this.multAcumulados).length > 0 ||
      Object.keys(this.selectedFragments).length > 0
    ) {
      const hider = this.components.get(OBC.Hider);
      const multAcumulados =
        Object.keys(this.multAcumulados).length > 0
          ? this.multAcumulados
          : this.selectedFragments;

      hider.isolate(multAcumulados);
      let arrIndSele: number[] = [];

      for (const key in multAcumulados) {
        const element = multAcumulados[key];
        const [valor] = [...element];
        const info = this.arrayCompleto[valor];
        const indice = this.expresIdInd[valor];
        arrIndSele.push(indice);
      }
      this.dataIFC.forEach((ele: any) => {
        if (!arrIndSele.includes(ele.ind)) {
          ele.visible = false;
        }
      });
      this.filaSel = null;
      this.infoSeleccionado = null;
    }
  }

  ocultarSeleccionados() {
    if (
      Object.keys(this.multAcumulados).length > 0 ||
      Object.keys(this.selectedFragments).length > 0
    ) {
      const hider = this.components.get(OBC.Hider);
      const multAcumulados =
        Object.keys(this.multAcumulados).length > 0
          ? this.multAcumulados
          : this.selectedFragments;

      hider.set(false, multAcumulados);
      let arrIndSele: number[] = [];
      for (const key in multAcumulados) {
        const element = multAcumulados[key];
        const [valor] = [...element];
        const info = this.arrayCompleto[valor];
        const indice = this.expresIdInd[valor];
        arrIndSele.push(indice);
      }
      this.dataIFC.forEach((ele: any) => {
        if (arrIndSele.includes(ele.ind)) {
          ele.visible = false;
        }
      });
      this.filaSel = null;
      this.infoSeleccionado = null;
      this.highlighter.clear();
      this.multAcumulados = {};
    }
  }

  verificarSiExisteVinculo(vinculos: any) {
    // let vinculo = false
    // const
    // if (vinculos.includes()) {
    // }
  }

  async restaurarGraficoCompleto() {
    this.multAcumulados = null;
    const eleBuscar: any = this.dataIFC[0];
    if (eleBuscar) {
      const fakeEvent = {
        target: {
          checked: true,
        },
      };
      fakeEvent.target.checked = true;
      await this.hiderRow(eleBuscar, fakeEvent, eleBuscar.ind);
      this.dataIFC = this.dataIFC.map((obj, index) => ({
        ...obj,
        visible: true,
      }));
      this.filaSel = null;
      this.infoSeleccionado = null;
    }
  }

  maxtodo() {
    for (let row of this.tablaMetrado) {
      if (row.item.split('.').length > 1) {
        row.mostrar = 1;
      }
      row.icomost = 1;
      row.estmost = 1;
    }
  }

  mintodo() {
    for (let row of this.tablaMetrado) {
      if (row.item.split('.').length == 1) {
        row.mostrar = 1;
      } else {
        row.icomost = 0;
        row.mostrar = 0;
      }
    }
  }

  toggleOnpresu(itemsel: any, indice: any) {
    //icomost   1 mostrar, 0 ocultar
    let pila: any = []; //objetos{ item, icomost }
    this.tablaMetrado[indice].icomost = 1;
    let nuevogru = false;
    for (let i = indice + 1; i < this.tablaMetrado.length; i++) {
      if (this.tablaMetrado[i].item != itemsel && !nuevogru) {
        var palabra = this.tablaMetrado[i].item
          .toString()
          .substring(0, itemsel.toString().length + 1);
        if (palabra == itemsel + '.') {
          if (
            itemsel.split('.').length + 1 ==
            this.tablaMetrado[i].item.toString().split('.').length
          ) {
            this.tablaMetrado[i].mostrar = 1;
            this.tablaMetrado[i].estmost = 1;
            if (this.tablaMetrado[i].unidad == '') {
              pila.push({
                item: this.tablaMetrado[i].item,
                icomost: this.tablaMetrado[i].icomost,
              });
            }
          } else {
            var palabra2 = this.tablaMetrado[i].item
              .toString()
              .substring(0, this.tablaMetrado[i].item.lastIndexOf('.'));
            let fila1 = pila.find((ele: any) => ele.item == palabra2);
            this.tablaMetrado[i].mostrar =
              fila1.icomost == 0 ? 0 : this.tablaMetrado[i].estmost;
            if (this.tablaMetrado[i].unidad == '') {
              pila.push({
                item: this.tablaMetrado[i].item,
                icomost: fila1.icomost == 0 ? 0 : this.tablaMetrado[i].icomost,
              });
            }
          }
        } else {
          nuevogru = true;
        }
      } else {
        break;
      }
    }
  }

  toggleOffpresu(itemsel: any, indice: any) {
    this.tablaMetrado[indice].icomost = 0;
    let ind2 = indice + 1;
    let nuevogru = false;
    for (let i = ind2; i < this.tablaMetrado.length; i++) {
      if (this.tablaMetrado[i].item != itemsel && !nuevogru) {
        var palabra = this.tablaMetrado[i].item
          .toString()
          .substring(0, itemsel.toString().length + 1);
        if (palabra == itemsel + '.') {
          if (
            itemsel.split('.').length + 1 ==
            this.tablaMetrado[i].item.toString().split('.').length
          ) {
            this.tablaMetrado[i].estmost = 0;
          }
          this.tablaMetrado[i].mostrar = 0;
        } else {
          nuevogru = true;
        }
      } else {
        break;
      }
    }
  }

  @HostListener('document:keydown.control', ['$event'])
  onCtrlDown(event: KeyboardEvent) {
    this.isCtrlPressed = true;
  }

  @HostListener('document:keyup.control', ['$event'])
  onCtrlUp(event: KeyboardEvent) {
    this.isCtrlPressed = false;
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    if (!this.tableContainer?.nativeElement?.contains(event.target)) {
      this.tablaPlantilla.forEach((row) => {
        Object.keys(row).forEach((k) => {
          if (k.startsWith('editar')) {
            row[k] = false;
          }
        });
      });
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDownPlantilla(event: KeyboardEvent): void {
    if (event.code === 'Escape') {
      this.area?.deleteAll();
      // this.area.dispose()
      this.dimensions?.deleteAll();
      // this.dimensions.dispose()
      this.volumen?.deleteAll();
      // this.volumen.dispose()
      this.volumen.clear();
      this.face?.deleteAll();
      // this.face.dispose()
      this.restaurarColoresVolumen(this.selectedFragments);
      this.clipper?.deleteAll();
      this.longitud?.deleteAll();
      // this.clipper.dispose()
      this.eliminarMeshesCreados();
    }
    if (event.code === 'Delete') {
      // this.area.delete();
      this.dimensions.delete();
      this.volumen.delete();
      this.face.delete();
      this.clipper.delete(this.world);
      this.longitud.delete();
      if (this.capturarVolumen && Object.keys(this.highlightVol).length !== 0) {
        this.limpiarVolSel(this.highlightVol);
      } else if (this.capturarArea) {
        if (!this.tipoManualData) {
          this.limpiarAreaSel(this.face);
        } else {
          this.eliminarMeshesCreados();
        }
      } else if (this.capturarPerimetro) {
        this.limpiarPerimetroSel(this.face);
      }
    }
    if (event.code === 'Enter') {
      if (
        this.capturarArea &&
        this.tipoManualData &&
        this.paso == 2 &&
        this.filPres !== null
      ) {
        setTimeout(() => {
          const areasArr = this.area.list;
          // for (const element of areasArr) {
          if (areasArr.length) {
            const element = areasArr[areasArr.length - 1];
            (element as any)._defaultLineMaterial.color.set(0x000000);
            const points = element.points.map(
              (p) => new THREE.Vector2(p.x, p.y)
            );
            const shape = new THREE.Shape(points);
            const geometry = new THREE.ShapeGeometry(shape);
            const material = new THREE.MeshBasicMaterial({
              color: 0xcce139,
              side: THREE.DoubleSide,
              transparent: true,
              depthTest: false,
              opacity: 0.8,
              blending: THREE.AdditiveBlending, // O prueba THREE.MultiplyBlending
            });
            const mesh = new THREE.Mesh(geometry, material);
            if (element.workingPlane)
              mesh.position.set(0, 0, element.workingPlane.constant);
            this.world.scene.three.add(mesh);
            const area = element.labelMarker.three.element.innerText.replace(
              ' m²',
              ''
            );

            // (element.labelMarker.three.element as HTMLElement).style.width =
            //   '39px';
            // (element.labelMarker.three.element as HTMLElement).style.height =
            //   '16px';
            // (element.labelMarker.three.element as HTMLElement).style.fontSize =
            //   '9px';
            // (element.labelMarker.three.element as HTMLElement).style.padding =
            //   '3px';
            this.formulaManual += this.formulaManual ? '+' + area : area;
            this.calculateFormula();
            this.meshAgregados.push(mesh);
            // }
          }
        }, 0);
      }
      if (
        this.capturarLongitud &&
        this.tipoManualData &&
        this.paso == 2 &&
        this.filPres !== null
      ) {
        setTimeout(() => {
          const longitudesArr = this.longitud.list;
          if (longitudesArr.length) {
            const element = longitudesArr[longitudesArr.length - 1];
            const longitud = element.label.three.element.innerText.replace(
              ' m',
              ''
            );

            // (element.label.three.element as HTMLElement).style.width = '39px';
            // (element.label.three.element as HTMLElement).style.height = '16px';
            // (element.label.three.element as HTMLElement).style.fontSize = '9px';
            // (element.label.three.element as HTMLElement).style.padding = '3px';
            this.formulaManual += this.formulaManual
              ? '+' + longitud
              : longitud;
            this.calculateFormula();
          }
        }, 0);
      }
    }
    if (this.filaPlantilla !== null) {
      const row = this.tablaPlantilla[this.filaPlantilla];
      var existe = Object.keys(row).find((k: any) => {
        if (k.startsWith('editar') && row[k] == true) {
          return k;
        }
      });
    }
    if (event.ctrlKey && event.key === 'ArrowRight') {
      if (this.filaPlantilla !== null) {
        this.bajarNivel(this.filaPlantilla);
      }
    } else if (event.ctrlKey && event.key === 'ArrowLeft') {
      if (this.filaPlantilla !== null) {
        this.subirNivel(this.filaPlantilla);
      }
    } else if (
      event.key === 'ArrowUp' &&
      this.filaPlantilla !== null &&
      !existe
    ) {
      if (this.filaPlantilla > 0) {
        this.filaPlantilla = this.filaPlantilla - 1;
      }
    } else if (
      event.key === 'ArrowDown' &&
      this.filaPlantilla !== null &&
      !existe
    ) {
      if (this.filaPlantilla < this.tablaPlantilla.length - 1) {
        this.filaPlantilla = this.filaPlantilla + 1;
      }
    }
  }

  async eliminarMeshesCreados() {
    this.meshAgregados.forEach((mesh) => {
      this.world.scene.three.remove(mesh);
      // mesh.geometry.dispose();
      // mesh.material.dispose();
    });
    this.meshAgregados = [];
    this.area?.deleteAll();
    // this.area.dispose()
  }

  async limpiarVolSel(highlightVol: any) {
    const searchKey = Object.keys(highlightVol)[0];
    const exists = this.acumuladosVolumen.findIndex((obj) =>
      Object.prototype.hasOwnProperty.call(obj, searchKey)
    );
    if (exists !== -1) {
      const keysToRemove = Object.keys(highlightVol);
      keysToRemove.forEach((key) => {
        if (this.selectedFragments.hasOwnProperty(key)) {
          delete this.selectedFragments[key];
        }
      });
      const colorarr = this.coloresRestaurarVol[exists];

      const encontrado = Object.values(this.vinculadosPartida).some(
        (set: any) => set.has(searchKey)
      );
      let color;
      if (encontrado) {
        color = new THREE.Color(0x299717);
      } else {
        color = new THREE.Color(colorarr[0], colorarr[1], colorarr[2]);
      }
      this.classifier.setColor(highlightVol, color, true);
      this.acumuladosVolumen.splice(exists, 1);
      this.coloresRestaurarVol.splice(exists, 1);

      if (Object.keys(this.selectedFragments).length !== 0) {
        const color = new THREE.Color(0xff0000);
        this.classifier.setColor(this.selectedFragments, color, true);
      }
      this.volumen?.deleteAll();
      this.volumen.clear();
      // this.volumen.dispose()
    }
  }

  async limpiarAreaSel(face: any) {
    this.acumuladosArea = this.acumuladosArea.filter((element) =>
      face.selection.some(
        (ele: any) =>
          ele.label.three.position.x === element.x &&
          ele.label.three.position.y === element.y &&
          ele.label.three.position.z === element.z
      )
    );
  }

  async limpiarPerimetroSel(face: any) {
    this.acumuladosPerimetro = this.acumuladosPerimetro.filter((element) =>
      face.selection.some(
        (ele: any) =>
          ele.label.three.position.x === element.x &&
          ele.label.three.position.y === element.y &&
          ele.label.three.position.z === element.z
      )
    );
  }

  async marcarVinculados(multAcumulados: any) {
    this.coloresRestaurar2 = {}; // Usamos un objeto en lugar de un array
    const color = new THREE.Color(0x299717); // Color para los elementos vinculados
    this.vinculadosPartida = multAcumulados;

    for await (const [key, valueSet] of Object.entries(multAcumulados)) {
      const row: any = this.arrFragments.find((ele: any) => ele.uuid === key);
      if (row) {
        // Guardamos el color original asociado al uuid del elemento

        this.coloresRestaurar2[key] = Object.values(
          JSON.parse(JSON.stringify(row.instanceColor.array))
        );
      }
    }

    this.classifier.setColor(multAcumulados, color, true);
  }

  restaurarColoresOriginales() {
    if (this.vinculadosPartida !== null) {
      let i = 0;
      for (const key in this.vinculadosPartida) {
        if (Object.prototype.hasOwnProperty.call(this.vinculadosPartida, key)) {
          let element: any = {};
          element[key] = this.vinculadosPartida[key];
          const colorarr = this.coloresRestaurar2[key];
          const color = new THREE.Color(colorarr[0], colorarr[1], colorarr[2]);
          this.classifier.setColor(element, color, true);
        }
        i++;
      }

      this.vinculadosPartida = null;
      this.coloresRestaurar2 = {};
    }
  }

  // limpiarVinculados() {
  //   if (this.vinculadosPartida !== null) {
  //     let i = 0;
  //     for (const key in this.vinculadosPartida) {
  //       if (Object.prototype.hasOwnProperty.call(this.vinculadosPartida, key)) {
  //         let element: any = {};
  //         element[key] = this.vinculadosPartida[key];
  //         const colorarr = this.coloresRestaurar[i];
  //         const color = new THREE.Color(colorarr[0], colorarr[1], colorarr[2]);
  //         this.classifier.setColor(element, color, true);
  //       }
  //       i++;
  //     }

  //     this.vinculadosPartida = null;
  //     this.coloresRestaurar = [];
  //   }
  // }

  // sliderIfc(row: any, ind: number, event: any, fuente: number) {
  //   const almacenar = [];

  //   let agregar = [];
  //   let eliminar = [];

  //   // if (row.nivel < 5) {
  //   //   for (let i = row.ind + 1; i < this.dataIFC.length; i++) {
  //   //     let element = this.dataIFC[i];
  //   //     if (element.nivel > row.nivel) {
  //   //       if (event.target.checked) {
  //   //         if (element.nivel > 4) {
  //   //           agregar.push(element.informacion.GlobalId.value);
  //   //         }
  //   //       } else {
  //   //         if (element.nivel > 4) {
  //   //           eliminar.push(element.informacion.GlobalId.value);
  //   //           this.limpiarResalElim(element.informacion.expressID);
  //   //         }
  //   //       }
  //   //       element.vinculado = event.target.checked;
  //   //     } else {
  //   //       break;
  //   //     }
  //   //   }
  //   // } else {
  //   //   if (event.target.checked) {
  //   //     agregar.push(row.informacion.GlobalId.value);
  //   //   } else {
  //   //     eliminar.push(row.informacion.GlobalId.value);
  //   //     this.limpiarResalElim(row.informacion.expressID);
  //   //   }
  //   // }
  //   // if (this.filPres !== null) {
  //   //   let vinculos = this.tablaMetrado[this.filPres].vinculos
  //   //     ? this.tablaMetrado[this.filPres].vinculos?.split('|')
  //   //     : [];
  //   //   if (agregar.length) {
  //   //     for (const element of agregar) {
  //   //       if (!vinculos.includes(element)) {
  //   //         vinculos.push(element);
  //   //       }
  //   //     }
  //   //   }
  //   //   if (eliminar.length) {
  //   //     for (const element of eliminar) {
  //   //       if (vinculos.includes(element)) {
  //   //         let indice = vinculos.indexOf(element);
  //   //         if (indice !== -1) {
  //   //           vinculos.splice(indice, 1);
  //   //         }
  //   //       }
  //   //     }
  //   //   }
  //   //   this.tablaMetrado[this.filPres].vinculos = vinculos.join('|');
  //   //   this.tablaMetrado[this.filPres].nombredoc = vinculos.length
  //   //     ? this.selectedFile.name
  //   //     : '';
  //   //   this.tablaMetrado[this.filPres].clavedoc = vinculos.length
  //   //     ? this.codigoDocumento
  //   //     : '';
  //   //   this.tablaMetrado[this.filPres].color = vinculos.length
  //   //     ? this.colorDocumento
  //   //     : '';
  //   //   if (!this.tablaMetrado[this.filPres].plantilla) {
  //   //     this.tablaMetrado[this.filPres].plantilla = '';
  //   //   }
  //   //   almacenar.push(this.tablaMetrado[this.filPres]);
  //   //   // this.guardarVinculos(almacenar);

  //   //   this.resaltarVinculados(vinculos);
  //   // }

  // }

  async sliderIfc(row: any, i: any, event: any) {
    if (this.filPres !== null) {
      this.loading = true;
      const concatenado: any = {};
      function addToSet(uuid: string, value: any) {
        if (value instanceof Set) {
          value.forEach((val) => addToSet(uuid, val));
        } else {
          concatenado[uuid].add(value);
        }
      }
      if (event.target.checked) {
        if (row.nivel < 5) {
           row.vinculado = event.target.checked;
          for (let i = row.ind + 1; i < this.dataIFC.length; i++) {
            let element = this.dataIFC[i];
            if (element.nivel > row.nivel) {
              if (element.nivel > 4) {
                const map = await this.busquedaFragmentos(
                  element.informacion.expressID
                );
                if (map) {
                  Object.entries(map).forEach(
                    ([uuid, value]: [string, any]) => {
                      if (!concatenado[uuid]) {
                        concatenado[uuid] = new Set();
                      }
                      addToSet(uuid, value);
                    }
                  );
                }
              }

              element.vinculado = event.target.checked;
            } else {
              break;
            }
          }
        } else {
          const map = await this.busquedaFragmentos(row.informacion.expressID);
          if (map) {
            Object.entries(map).forEach(([uuid, value]: [string, any]) => {
              if (!concatenado[uuid]) {
                concatenado[uuid] = new Set();
              }
              addToSet(uuid, value);
            });
          }
        }
        await this.agregarNuevosVinc(concatenado);
      } else {
        let eliminar = [];
        if (row.nivel < 5) {
          row.vinculado = event.target.checked;
          for (let i = row.ind + 1; i < this.dataIFC.length; i++) {
            let element = this.dataIFC[i];
            if (element.nivel > row.nivel) {
              if (element.nivel > 4) {
                eliminar.push(element);
              }

              element.vinculado = event.target.checked;
            } else {
              break;
            }
          }
        } else {
          eliminar.push(row);
        }
       await  this.eliminarVinExisten(eliminar)
      }
      this.highlighter.clear()
      this.filaSel = null
      this.loading = false;
    }
  }

  async agregarNuevosVinc(concatenado: any) {
    if (this.filPres !== null &&  Object.keys(concatenado).length > 0) {
      this.loading = true;
      this.multAcumulados = concatenado;
      const multAcumulados = concatenado;
      const nuevosElementos = await this.recuperarElementosByMaps(
        multAcumulados,
        this.filPres
      );

      const index = JSON.parse(JSON.stringify(this.filPres));
      this.filPres = null;
      await this.selFilTabMetr(this.tablaMetrado[index], index);
      if (nuevosElementos.length && this.filPres !== null) {
        if (
          this.tablaMetrado[this.filPres].plantilla &&
          this.filPres !== null &&
          this.tablaDetalles[this.filPres].length
        ) {
          this.tablaGenerada = this.tablaDetalles[this.filPres];
          for (const element of nuevosElementos) {
            const dataElement = this.arrGlobalsIds[element];
            const indice = this.gruposKeys.findIndex(
              (ele) => ele == dataElement.informacion?.ObjectType?.value
            );
            if (indice !== -1) {
              const grupo = 'G' + (indice + 1);
              let filasPlantilla: any = this.tablaPlantilla.filter(
                (ele) => ele.clave_metrado == grupo
              );
              for (const filplantilla of filasPlantilla) {
                let modificar =
                  filplantilla.tipo == 'Met' || filplantilla.tipo == 'Subm'
                    ? true
                    : false;
                if (filplantilla.tipo == 'Met') {
                  let sgte = null;
                  for (
                    let i = Number(filplantilla.ind);
                    i < this.tablaPlantilla.length;
                    i++
                  ) {
                    const element = this.tablaPlantilla[i];
                    if (element.clave_metrado) {
                      sgte = element;
                    }
                  }
                  if (sgte && sgte.tipo == 'Subm') {
                    modificar = false;
                  }
                }
                if (modificar) {
                  const arr = this.gruposVinc[this.gruposKeys[indice]];
                  const arrayDesglosado = await this.genDatFilPlant(
                    filplantilla,
                    arr,
                    this.tablaMetrado[this.filPres],
                    indice
                  );
                  let arrayReemplazo: any[] = [];
                  const filasTabGenerad = this.tablaGenerada.filter(
                    (ele) => filplantilla.id_plantilla == ele.item
                  );
                  if (filplantilla.cantidad == 'ACU') {
                    arrayReemplazo = await this.dataAcumFilPlant(
                      arrayDesglosado,
                      filplantilla,
                      this.tablaMetrado[this.filPres]
                    );

                    filasTabGenerad.forEach((element) => {
                      const indFil = this.tablaGenerada.findIndex(
                        (ele) => ele == element
                      );
                      this.tablaGenerada.splice(
                        indFil,
                        filasTabGenerad.length,
                        ...arrayReemplazo
                      );
                      this.tablaGenerada.forEach((ele, index) => {
                        ele.ind = index;
                        ele.id_metrado = index;
                      });
                    });
                  } else {
                    // filasTabGenerad.forEach(element => {
                    const indFil = this.tablaGenerada.findIndex(
                      (ele) => ele == filasTabGenerad[0]
                    );
                    this.tablaGenerada.splice(
                      indFil,
                      filasTabGenerad.length,
                      ...arrayDesglosado
                    );
                    this.tablaGenerada.forEach((ele, index) => {
                      ele.ind = index;
                      ele.id_metrado = index;
                    });
                    //  });
                  }
                }
              }
            } else {
              console.log('noExiste', indice);
            }
          }
        }
      }
      const modificados = [this.filPres];
      await this.guardarCambios(modificados);
      this.highlighter.clear();
      this.loading = false;
    }
  }

  async eliminarVinExisten(arrayEliminar:any) {
    await this.restaurarColoresOriginales();
    if (this.filPres !== null && arrayEliminar.length) {
      const vinculos = this.tablaMetrado[this.filPres].vinculos
        ? JSON.parse(
            JSON.stringify(this.tablaMetrado[this.filPres].vinculos?.split('|'))
          )
        : [];
      for (const row of arrayEliminar) {
        if (vinculos.includes(row.informacion.GlobalId.value)) {
          const indice = vinculos.indexOf(row.informacion.GlobalId.value);
          if (indice !== -1) {
            let vinculos2 = JSON.parse(JSON.stringify(vinculos));
            vinculos2.splice(indice, 1);
            // const fragment = await this.busquedaFragmentos(
            //   row.informacion.expressID
            // );
            this.tablaMetrado[this.filPres].nombredoc = vinculos2.length
              ? this.selectedFile.name
              : '';
            this.tablaMetrado[this.filPres].clavedoc = vinculos2.length
              ? this.codigoDocumento
              : '';
            this.tablaMetrado[this.filPres].color = vinculos2.length
              ? this.colorDocumento
              : '';
            await this.resaltarVinculados(vinculos2);
            await this.eliminarVinculoDeDatos(this.gruposVinc, row, false);
            // this.listaVinculados.splice(ind, 1);
            this.filaResum = null;
            this.tablaMetrado[this.filPres].vinculos = vinculos2.join('|');
          }
        }
      }
      const modificados = [this.filPres];
      await this.guardarCambios(modificados);
      this.highlighter.clear();
    }
  }

  vincularResaltados() {
    if (this.filPres !== null && this.tablaMetrado[this.filPres].unidad) {
      this.confirmationService.confirm({
        message:
          '¿Estás seguro de vincular los seleccionados a la partida seleccionada?',
        header: 'Vincular seleccionados',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Vincular',
        rejectLabel: 'Cancelar',
        defaultFocus: 'reject',
        accept: async () => {
          if (this.filPres !== null) {
            this.loading = true;
            const multAcumulados =
              Object.keys(this.multAcumulados).length > 0
                ? this.multAcumulados
                : this.selectedFragments;

            const nuevosElementos = await this.recuperarElementosByMaps(
              multAcumulados,
              this.filPres
            );

            const index = JSON.parse(JSON.stringify(this.filPres));
            this.filPres = null;
            await this.selFilTabMetr(this.tablaMetrado[index], index);
            if (nuevosElementos.length && this.filPres !== null) {
              if (
                this.tablaMetrado[this.filPres].plantilla &&
                this.filPres !== null &&
                this.tablaDetalles[this.filPres].length
              ) {
                this.tablaGenerada = this.tablaDetalles[this.filPres];
                for (const element of nuevosElementos) {
                  const dataElement = this.arrGlobalsIds[element];
                  const indice = this.gruposKeys.findIndex(
                    (ele) => ele == dataElement.informacion?.ObjectType?.value
                  );
                  if (indice !== -1) {
                    const grupo = 'G' + (indice + 1);
                    let filasPlantilla: any = this.tablaPlantilla.filter(
                      (ele) => ele.clave_metrado == grupo
                    );
                    for (const filplantilla of filasPlantilla) {
                      let modificar =
                        filplantilla.tipo == 'Met' ||
                        filplantilla.tipo == 'Subm'
                          ? true
                          : false;
                      if (filplantilla.tipo == 'Met') {
                        let sgte = null;
                        for (
                          let i = Number(filplantilla.ind);
                          i < this.tablaPlantilla.length;
                          i++
                        ) {
                          const element = this.tablaPlantilla[i];
                          if (element.clave_metrado) {
                            sgte = element;
                          }
                        }
                        if (sgte && sgte.tipo == 'Subm') {
                          modificar = false;
                        }
                      }
                      if (modificar) {
                        const arr = this.gruposVinc[this.gruposKeys[indice]];
                        const arrayDesglosado = await this.genDatFilPlant(
                          filplantilla,
                          arr,
                          this.tablaMetrado[this.filPres],
                          indice
                        );
                        let arrayReemplazo: any[] = [];
                        const filasTabGenerad = this.tablaGenerada.filter(
                          (ele) => filplantilla.id_plantilla == ele.item
                        );
                        if (filplantilla.cantidad == 'ACU') {
                          arrayReemplazo = await this.dataAcumFilPlant(
                            arrayDesglosado,
                            filplantilla,
                            this.tablaMetrado[this.filPres]
                          );

                          filasTabGenerad.forEach((element) => {
                            const indFil = this.tablaGenerada.findIndex(
                              (ele) => ele == element
                            );
                            this.tablaGenerada.splice(
                              indFil,
                              filasTabGenerad.length,
                              ...arrayReemplazo
                            );
                            this.tablaGenerada.forEach((ele, index) => {
                              ele.ind = index;
                              ele.id_metrado = index;
                            });
                          });
                        } else {
                          // filasTabGenerad.forEach(element => {
                          const indFil = this.tablaGenerada.findIndex(
                            (ele) => ele == filasTabGenerad[0]
                          );
                          this.tablaGenerada.splice(
                            indFil,
                            filasTabGenerad.length,
                            ...arrayDesglosado
                          );
                          this.tablaGenerada.forEach((ele, index) => {
                            ele.ind = index;
                            ele.id_metrado = index;
                          });
                          //  });
                        }
                      }
                    }
                  } else {
                    console.log('noExiste', indice);
                  }
                }
              }
            }
            const modificados = [this.filPres];
            await this.guardarCambios(modificados);
            this.loading = false;
          }
        },
        reject: () => {},
      });
    } else {
      let msj = this.filPres
        ? 'La fila seleccionada en presupuesto no es una partida'
        : 'Ninguna partida  metrado presupuesto seleccionado';

      this._snackBar.open(msj, '', {
        duration: 5000,
        panelClass: ['error-snack-bar'],
      });
    }
  }

  async recuperarElementosByMaps(map: any, filPres: number) {
    const values = Object.values(map);
    const uniqueValues = [...new Set(values.flatMap((set: any) => [...set]))];
    let data: any[] = [];
    const inicial = this.tablaMetrado[filPres].vinculos
      ? this.tablaMetrado[filPres].vinculos?.split('|')
      : [];
    let vinculos = this.tablaMetrado[filPres].vinculos
      ? this.tablaMetrado[filPres].vinculos?.split('|')
      : [];
    for (const element of uniqueValues) {
      const globalId = this.arrayCompleto[element].GlobalId?.value;
      if (globalId) {
        if (!vinculos.includes(globalId)) {
          vinculos.push(globalId);
        }
      }
    }
    const nuevosElementos = vinculos.filter(
      (elemento: any) => !inicial.includes(elemento)
    );
    this.tablaMetrado[filPres].vinculos = vinculos.join('|');
    this.tablaMetrado[filPres].nombredoc = vinculos.length
      ? this.selectedFile.name
      : '';
    this.tablaMetrado[filPres].clavedoc = vinculos.length
      ? this.codigoDocumento
      : '';
    this.tablaMetrado[filPres].color = vinculos.length
      ? this.colorDocumento
      : '';
    if (!this.tablaMetrado[filPres].plantilla) {
      this.tablaMetrado[filPres].plantilla = '';
    }

    // this.guardarVinculos([this.tablaMetrado[filPres]], false);
    // if (this.filPres !== null) {
    //   // this.limpiarVinculados();
    //   this.restaurarColoresOriginales();
    //   const arr = this.tablaMetrado[this.filPres].vinculos.split('|');
    //   this.resaltarVinculados(arr);
    // }
    return nuevosElementos;
  }

  async resaltarSelResumen(index: number) {
    if (index == this.filaResum) {
      return;
    }
    // const classifier = this.components.get(OBC.Classifier);
    this.filaResum = index;
    const fragmentMap = await this.busquedaFragmentos(
      this.listaVinculados[index].informacion.expressID
    );
    if (
      Object.keys(fragmentMap).length !== 0 &&
      this.vinculadosPartida !== null
    ) {
      for (const key in this.vinculadosPartida) {
        if (Object.prototype.hasOwnProperty.call(this.vinculadosPartida, key)) {
          let element: any = {};
          element[key] = this.vinculadosPartida[key];
          const existe = Object.values(element).some((set: any) =>
            set.has(this.listaVinculados[index].informacion.expressID)
          );
          let color = new THREE.Color(0x299717);
          if (existe) {
            color = new THREE.Color(0xe7aa26);
          }
          this.classifier.setColor(element, color, true);
        }
      }
    }
  }

  cerradoModal() {
    this.ultimoVincResl = null;
    this.filaResum = null;
    this.listaVinculados = [];
    if (this.filPres !== null) {
      for (const key in this.vinculadosPartida) {
        if (Object.prototype.hasOwnProperty.call(this.vinculadosPartida, key)) {
          let element: any = {};
          element[key] = this.vinculadosPartida[key];
          const color = new THREE.Color(0x299717);
          this.classifier.setColor(element, color, true);
        }
      }
    }
  }

  async eliminarVinculo(row: any, ind: any) {
    this.loading = true;
    await this.restaurarColoresOriginales();
    setTimeout(async () => {
      if (this.filPres !== null) {
        const vinculos = this.tablaMetrado[this.filPres].vinculos
          ? JSON.parse(
              JSON.stringify(
                this.tablaMetrado[this.filPres].vinculos?.split('|')
              )
            )
          : [];
        if (vinculos.includes(row.informacion.GlobalId.value)) {
          const indice = vinculos.indexOf(row.informacion.GlobalId.value);
          if (indice !== -1) {
            let vinculos2 = JSON.parse(JSON.stringify(vinculos));
            vinculos2.splice(indice, 1);
            // const fragment = await this.busquedaFragmentos(
            //   row.informacion.expressID
            // );
            this.tablaMetrado[this.filPres].nombredoc = vinculos2.length
              ? this.selectedFile.name
              : '';
            this.tablaMetrado[this.filPres].clavedoc = vinculos2.length
              ? this.codigoDocumento
              : '';
            this.tablaMetrado[this.filPres].color = vinculos2.length
              ? this.colorDocumento
              : '';
            await this.resaltarVinculados(vinculos2);
            await this.eliminarVinculoDeDatos(this.gruposVinc, row);
            this.listaVinculados.splice(ind, 1);
            this.filaResum = null;
            this.tablaMetrado[this.filPres].vinculos = vinculos2.join('|');
          }
        }

        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Correcto',
          detail: 'Se desvinculo correctamente',
        });
      }
    }, 10);
  }

  async eliminarVinculoDeDatos(datos: any, row: any, almacenar = true) {
    this.gruposVisibles = [];
    let i = 0;
    let filTabGenElm: any[] = [];
    for (const key in datos) {
      if (datos.hasOwnProperty(key)) {
        const index = datos[key].findIndex(
          (elemento: any) =>
            elemento.clase === row.clase && elemento.ind === row.ind
        );
        if (index !== -1) {
          datos[key].splice(index, 1);
          if (datos[key].length === 0) {
            const grupoEliminar = this.selectGrupos[i + 1];
            await this.eliminarFilasPlantilla(
              grupoEliminar,
              row.informacion.GlobalId.value
            );
            delete datos[key];
          }
          break;
        }
      }
      i++;
    }
    this.gruposKeys = Object.keys(this.gruposVinc);

    this.selectGrupos = this.gruposKeys.map((_, index) => `G${index + 1}`);
    this.selectGrupos.unshift('M');
    this.gruposKeys.map((ele) => this.gruposVisibles.push(false));
    await this.ajustarNiveles();

    for (const element of this.tablaPlantilla) {
      if (element.clave_metrado && element.clave_metrado !== 'M') {
        const index = this.gruposKeys.findIndex(
          (ele) => ele == element.descripcion
        );
        element.clave_metrado = 'G' + (index + 1);
      }
    }
    const obj: Plantilla = {
      altura: '',
      ancho: '',
      cantidad: '',
      clave_metrado: '',
      descripcion: '',
      editardescripcion: false,
      editaraltura: false,
      editarancho: false,
      editarcantidad: false,
      editarclave_metrado: false,
      editarlargo: false,
      editarn_veces: false,
      editartipo: false,
      ind: this.tablaPlantilla.length,
      largo: '',
      n_veces: '',
      id_plantilla: 0,
      tipo: '',
      archivo: '',
      editararchivo: false,
    };
    if (this.tablaPlantilla.length < 11) {
      const nroFilas = 10 - this.tablaPlantilla.length;
      for (let i = 0; i < nroFilas; i++) {
        this.tablaPlantilla.push(obj);
      }
    } else {
      this.tablaPlantilla.push(obj);
    }
    if (this.filPres !== null) {
      // await this.guardarPlantilla();
      this.tablaDetalles[this.filPres] = this.tablaGenerada;
      await this.actuaPlantillaPres(this.filPres, this.tablaPlantilla);
      if (almacenar) {
        this.guardarCambios([this.filPres]);
      }
    }
  }

  async eliminarFilasPlantilla(grupoElim: any, globalid: any) {
    let j = 0;
    // let arrayElim = []
    if (this.filPres !== null) {
      var filaSel = this.tablaMetrado[this.filPres];
    }
    // for (const element of this.tablaPlantilla) {
    //   if (element.clave_metrado == grupoElim) {
    //     const id_eliminar = element.id_plantilla;
    //     for (let i = 0; i < this.tablaGenerada.length; i++) {
    //       const fil = this.tablaGenerada[i];
    //       if (fil['item'] == id_eliminar) {
    //         this.tablaGenerada.splice(i, 1);
    //       }
    //     }
    //     if (element.tipo == 'Subm') {
    //       const filaAnterior = this.buscarFilaAnterior(element);
    //       if (filaAnterior) {
    //         filaAnterior.cantidad = 'ACU';
    //         let indice = null;
    //         const match = filaAnterior.clave_metrado.match(/\d+/);
    //         if (match) {
    //           indice = parseInt(match[0]) - 1;
    //         }
    //         let arr: any[] = [];
    //         if (indice !== null) {
    //           arr = this.gruposVinc[this.gruposKeys[indice]];
    //           const arrayDesglosado = await this.genDatFilPlant(
    //             filaAnterior,
    //             arr,
    //             filaSel,
    //             indice
    //           );
    //           const noRepetidos = await this.dataAcumFilPlant(
    //             arrayDesglosado,
    //             filaAnterior,
    //             filaSel
    //           );
    //           const index = this.tablaGenerada.findIndex(
    //             (ele) => filaAnterior.id_plantilla == ele.item
    //           );
    //           for (const element of noRepetidos) {
    //             element.ejes = this.tablaGenerada[index].ejes;
    //             element.detalle = this.tablaGenerada[index].detalle;
    //           }
    //           this.tablaGenerada.splice(index, 1, ...noRepetidos);
    //           this.tablaGenerada.forEach((ele, index) => {
    //             ele.ind = index;
    //             ele.id_metrado = index;
    //           });
    //         }
    //       }
    //     }
    //     this.tablaPlantilla.splice(j, 1);
    //   }
    //   j++;
    // }
    // let idsEliminar:any = []
    let eliminarSubm = false;

    // for (const element of this.tablaPlantilla) {
    //   if (eliminarSubm) {
    //     console.log('sss', element);
    //     if (element.tipo == 'Subm') {
    //       // if (!idsEliminar.includes(element.id_plantilla)) {
    //       //   idsEliminar.push(element.id_plantilla)
    //       // }
    //       for (let i = 0; i < this.tablaGenerada.length; i++) {
    //         const fil = this.tablaGenerada[i];
    //         if (fil['item'] == element.id_plantilla) {
    //           this.tablaGenerada.splice(i, 1);
    //         }
    //       }
    //       const index = this.tablaPlantilla.findIndex(ele => ele == element)
    //       console.log('aindex', index)
    //       this.tablaPlantilla.splice(index, 1);
    //     } else {
    //       eliminarSubm = false;
    //     }
    //   }
    //   if (element.clave_metrado == grupoElim) {
    //     for (let i = 0; i < this.tablaGenerada.length; i++) {
    //       const fil = this.tablaGenerada[i];
    //       if (fil['item'] == element.id_plantilla) {
    //         this.tablaGenerada.splice(i, 1);
    //       }
    //     }
    //     console.log('element', element);
    //     if (element.tipo == 'Met') {
    //       eliminarSubm = true;
    //     }
    //     const index = this.tablaPlantilla.findIndex(ele => ele == element)
    //     console.log('bindex', index)
    //     this.tablaPlantilla.splice(index, 1);
    //   }

    // }
    let nuevosElementos = [];
    const idsAEliminar = new Set();

    for (const element of this.tablaPlantilla) {
      if (eliminarSubm && element.tipo === 'Subm') {
        idsAEliminar.add(element.id_plantilla);
      } else if (element.clave_metrado === grupoElim) {
        idsAEliminar.add(element.id_plantilla);
        if (element.tipo === 'Met') {
          eliminarSubm = true;
        }
      } else {
        nuevosElementos.push(element);
      }
    }

    for (const element of nuevosElementos) {
      if (
        element.clave_metrado &&
        element.tipo == 'Met' &&
        element.cantidad == ''
      ) {
        if (element.clave_metrado !== 'M') {
          element.cantidad = 'ACU';
          let indice = null;
          const match = element.clave_metrado.match(/\d+/);
          if (match) {
            indice = parseInt(match[0]) - 1;
          }
          let arr: any[] = [];
          if (indice !== null) {
            arr = this.gruposVinc[this.gruposKeys[indice]];
            const arrayDesglosado = await this.genDatFilPlant(
              element,
              arr,
              filaSel,
              indice
            );
            const noRepetidos = await this.dataAcumFilPlant(
              arrayDesglosado,
              element,
              filaSel
            );
            const index = this.tablaGenerada.findIndex(
              (ele) => element.id_plantilla == ele.item
            );
            for (const element of noRepetidos) {
              element.ejes = this.tablaGenerada[index].ejes;
              element.detalle = this.tablaGenerada[index].detalle;
            }
            this.tablaGenerada.splice(index, 1, ...noRepetidos);
            this.tablaGenerada.forEach((ele, index) => {
              ele.ind = index;
              ele.id_metrado = index;
            });
          }
        } else {
          element.cantidad = '1';
        }
      }
    }

    // Actualizar tablaPlantilla
    nuevosElementos = nuevosElementos.map((item, index) => ({
      ...item,
      ind: index,
      id_plantilla: item.clave_metrado !== '' ? item.id_plantilla : '',
    }));
    this.tablaPlantilla = nuevosElementos.reverse();

    this.tablaGenerada = this.tablaGenerada.filter(
      (fil) => !idsAEliminar.has(Number(fil['item']))
    );
    this.tablaGenerada = await this.calculosTotales(this.tablaGenerada);
    this.tablaGenerada.forEach((ele, index) => {
      (ele.ind = index), (ele.id_metrado = index);
    });

    if (this.filPres !== null) {
      //  this.tablaDetalles[this.filPres] = this.tablaGenerada
    }
  }

  limpiarResalElim(valueToRemove: any) {
    let indices = [];
    let i = 0;
    for (let key in this.vinculadosPartida) {
      let set = this.vinculadosPartida[key];
      if (set.has(valueToRemove)) {
        let element: any = {};
        element[key] = this.vinculadosPartida[key];
        indices.push(key);
        const colorarr = this.coloresRestaurar2[key];
        const color = new THREE.Color(colorarr[0], colorarr[1], colorarr[2]);
        this.classifier.setColor(element, color, true);
        // Eliminar la clave y su Set
        delete this.vinculadosPartida[key];
      }
      i++;
    }
    indices.reverse();
    for (const ind of indices) {
      // this.coloresRestaurar.splice(ind, 1);
      delete this.coloresRestaurar2[ind];
    }
  }

  ocultarNoVinculados() {
    if (this.filPres == null) {
      this._snackBar.open('Ninguna fila seleccionada', '', {
        duration: 3000,
        panelClass: ['error-snack-bar'],
      });
      return;
    } else if (!this.tablaMetrado[this.filPres].unidad) {
      this._snackBar.open('La fila seleccionada no es partida', '', {
        duration: 3000,
        panelClass: ['error-snack-bar'],
      });
      return;
    } else {
      if (this.vinculadosPartida) {
        const hider = this.components.get(OBC.Hider);
        hider.isolate(this.vinculadosPartida);
      }
    }
  }

  ocultarVinculados() {
    if (this.filPres == null) {
      this._snackBar.open('Ninguna fila seleccionada', '', {
        duration: 3000,
        panelClass: ['error-snack-bar'],
      });
      return;
    } else if (!this.tablaMetrado[this.filPres].unidad) {
      this._snackBar.open('La fila seleccionada no es partida', '', {
        duration: 3000,
        panelClass: ['error-snack-bar'],
      });
      return;
    } else {
      if (this.vinculadosPartida) {
        const hider = this.components.get(OBC.Hider);
        hider.set(false, this.vinculadosPartida);
      }
    }
  }

  copiarMultVinc(event: any, row: any, i: any) {
    const ind: number = row.ind;
    if (this.filPres !== null) {
      if (!this.indCopVinc.includes(ind) && event.checked) {
        this.indCopVinc.push(ind);
      }
      if (this.indCopVinc.includes(ind) && !event.checked) {
        const index = this.indCopVinc.indexOf(ind);
        if (index !== -1) {
          this.indCopVinc.splice(index, 1);
        }
      }
    }
  }

  async guardarMultiple() {
    if (this.indCopVinc.length && this.filPres) {
      let arrayGuardar = [];
      const partida = JSON.parse(
        JSON.stringify(this.tablaMetrado[this.filPres])
      );
      if (!partida.vinculos) {
        return;
      }
      for (const ind of this.indCopVinc) {
        this.tablaMetrado[ind].vinculos = partida.vinculos;
        this.tablaMetrado[ind].nombredoc = partida.nombredoc;
        this.tablaMetrado[ind].clavedoc = partida.clavedoc;
        arrayGuardar.push(this.tablaMetrado[ind]);
      }
      // await this.guardarVinculos(arrayGuardar, false);
      this.multPres = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Correcto',
        detail: 'Se almacenó correctamente',
      });
    }
  }

  async limpiarVinculosPartida() {
    this.confirmationService.confirm({
      message:
        '¿Estás seguro se eliminaran todas las filas relacionadas  en plantilla y tabla generada?',
      header: 'Vincular seleccionados',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Vincular',
      rejectLabel: 'Cancelar',
      defaultFocus: 'reject',
      accept: async () => {
        if (this.filPres !== null) {
          this.loading = true;
          this.visible = false;
          this.tablaMetrado[this.filPres].vinculos = '';
          this.tablaMetrado[this.filPres].nombredoc = '';
          this.tablaMetrado[this.filPres].clavedoc = '';
          this.tablaMetrado[this.filPres].color = '';
          await this.eliminarNoManueales(this.filPres);
          await this.guardarCambios([this.filPres]);
          const index = JSON.parse(JSON.stringify(this.filPres));
          this.filPres = null;
          await this.selFilTabMetr(this.tablaMetrado[index], index);
          this.loading = false;
        }
      },
      reject: () => {},
    });
  }

  async eliminarNoManueales(filPres: number) {
    if (!this.tablaGenerada.length && this.tablaMetrado[filPres].plantilla) {
      this.tablaPlantilla = this.tablaDetalles[filPres];
    }
    this.tablaPlantilla = this.tablaPlantilla
      .filter(
        (element) => element.clave_metrado && element.clave_metrado === 'M'
      )
      .map((element, index) => {
        element.tipo = 'Met'; // Cambiar el tipo a 'Met'
        return element;
      });
    const idsPlantilla = new Set(
      this.tablaPlantilla
        .filter((element) => element.id_plantilla !== null) // Solo los que tienen id_plantilla válido
        .map((element) => element.id_plantilla)
    );

    this.tablaGenerada = this.tablaGenerada
      .map((element) => {
        if (idsPlantilla.has(element.item)) {
          element.tieneSubmetrado = 0;
          element.estitulo = 0;
          element.esMetrado = 1;
          return element;
        }
        return null;
      })
      .filter((element) => element !== null);
    let contadorId = 1;

    this.tablaPlantilla = this.tablaPlantilla.map((element) => {
      if (element.clave_metrado) {
        const elementosRelacionados = this.tablaGenerada.filter(
          (genElement) => genElement.item === element.id_plantilla
        );

        elementosRelacionados.forEach((genElement) => {
          genElement.item = contadorId;
          genElement.tieneSubmetrado = 0;
          genElement.estitulo = 0;
          genElement.esMetrado = 1;
        });

        element.id_plantilla = contadorId++;
      } else {
        element.id_plantilla = '';
      }
      return element;
    });
    this.tablaDetalles[filPres] = this.tablaGenerada;
    await this.actuaPlantillaPres(this.filPres, this.tablaPlantilla);
  }

  contraerMismoNivel() {
    if (this.filaSel !== null) {
      const nivel = this.dataIFC[this.filaSel].nivel;
      for (const element of this.dataIFC) {
        if (element.nivel == nivel + 1) {
          element.mostrar = false;
          element.active = false;
        } else if (element.nivel > nivel + 1) {
          element.mostrar = false;
          element.active = false;
        } else if (element.nivel == nivel) {
          element.active = true;
        }
      }
    }
  }

  expandirMismoNivel() {
    if (this.filaSel !== null) {
      const nivel = this.dataIFC[this.filaSel].nivel;
      for (const element of this.dataIFC) {
        if (element.nivel == nivel + 1) {
          element.mostrar = true;
          element.active = true;
        } else if (element.nivel > nivel + 1) {
          element.mostrar = false;
          element.active = false;
        } else if (element.nivel == nivel) {
          element.active = false;
        }
      }
    }
  }

  completarArray(arrayInicial: number[][], n: number): number[][] {
    if (arrayInicial.length === 0) {
      return Array(n).fill(Array(10).fill(''));
    }

    if (arrayInicial.length > 1) {
      const filasCompletadas = arrayInicial.map((fila) => {
        return [...fila, ...Array(10 - fila.length).fill('')].slice(0, 10);
      });

      while (filasCompletadas.length < n) {
        filasCompletadas.push(Array(10).fill(''));
      }

      return filasCompletadas;
    }

    const filas = [...arrayInicial];
    while (filas.length < n) {
      filas.push(Array(10).fill(''));
    }
    return filas;
  }

  crearTablaPlantilla2(arr: any) {
    const arrobj = [
      'clave_metrado',
      'tipo',
      'descripcion',
      'cantidad',
      'n_veces',
      'largo',
      'ancho',
      'altura',
      'ind',
      'id_plantilla',
    ];
    for (const element of arr) {
      let obj: Plantilla = {} as Plantilla;
      let i = 0;
      for (const celda of arrobj) {
        obj[celda] = element[i];
        i++;
      }
      this.tablaPlantilla.push(obj);
    }
  }

  isNumber(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  async onRadioChange(option: string) {
    // this.tablaPlantilla = []
    this.filaPlantilla = null;
    if (option === 'metrado') {
      this.paso = 2;
      this.pasoGenerarMetrado();
    } else if (option == 'data') {
      this.paso = 0;

      await this.restaurarColoresOriginales();
      this.filPres = null;
    } else {
      this.paso = 1;
      // this.tablaGenerada = [];
      this.mostrarPrevPlant = false;
      this.cerradoModalFormMan();
    }
    // this.limpiarVinculados();

    this.visible = false;
    this.visible2 = false;
    this.filSelVinc = null;
    // this.gruposVisibles = [];
    this.dataGrupoSel = null;
    this.ultimaCelda = null;
    this.visible3 = false;
    this.visible4 = false;
    this.formulaManual = '';
    this.formula = '';
    this.formulaManual = '';
    this.maximizarPlant = false;
  }

  async pasoGenerarMetrado() {
    this.loading = true;

    setTimeout(async () => {
      this.paso = 2;
      this.loading = false;
    }, 100);
  }

  habEditPlant(ind: any, celda: any, event?: any) {
    this.tablaPlantilla.forEach((row, index) => {
      Object.keys(row).forEach((k) => {
        if (k.startsWith('editar')) {
          row[k] = false; // Desactiva todas las propiedades de edición
        }
      });
      row.ind = index;
    });
    if (event) {
      event.stopPropagation();
    }

    this.gruposVisibles = [];
    this.filSelVinc = null;
    this.filaPlantilla = ind;
    if (
      this.paso == 2 &&
      this.filPres !== null &&
      this.tablaMetrado[this.filPres].unidad
    ) {
      const row = this.tablaMetrado[this.filPres];
      if (
        !row.unidad ||
        (row.clavedoc && row.clavedoc !== this.codigoDocumento)
      ) {
        return;
      }
      const row2 = this.tablaPlantilla[ind];
      if (
        row2.clave_metrado &&
        row2.clave_metrado !== 'M' &&
        row2.tipo !== 'Tit' &&
        celda == 'descripcion'
      ) {
        return;
      }

      this.tablaPlantilla[ind]['editar' + celda] = true;
      const texto = this.tablaPlantilla[ind][celda];
      this.visible4 = false;
      this.visible2 = false;
      this.filSelVinc = null;
      this.dataGrupoSel = null;
      this.ultimaCelda = null;
      this.formulaManual = '';
      this.formula = '';
      if (typeof texto === 'string' && texto.charAt(0) === '=') {
        this.ultimaCelda = celda;
        if (this.tablaPlantilla[ind].clave_metrado !== 'M') {
          this.visible2 = true;
          this.formula = texto.slice(1);
        } else {
          this.visible4 = true;
        }
      }
    }
  }

  togleGrupos(index: any) {
    this.gruposVisibles[index] = !this.gruposVisibles[index];
  }

  retornarValue(grupo: any) {
    let array: any[] = [];
    array = this.gruposVinc[grupo];
    return array;
  }

  onKeyDown(event: any, i: any, key: any) {
    const target: HTMLInputElement = event.target as HTMLInputElement;
    if (event.key === 'ArrowUp') {
      if (i > 0) {
        event.target.blur();
        this.tablaPlantilla[i]['editar' + key] = false;
        this.tablaPlantilla[i - 1]['editar' + key] = true;
        this.handleFormulaDisplay(this.tablaPlantilla[i - 1]?.[key], key, i);
      }
    } else if (event.key === 'ArrowDown') {
      if (i < this.tablaPlantilla.length - 1) {
        event.target.blur();
        this.tablaPlantilla[i]['editar' + key] = false;
        this.tablaPlantilla[i + 1]['editar' + key] = true;
        this.handleFormulaDisplay(this.tablaPlantilla[i + 1]?.[key], key, i);
      }
    } else if (event.key === 'ArrowLeft') {
      if (target.selectionStart === 0 && target.selectionEnd === 0) {
        let col: any = this.sgteColumna(key, false);
        if (
          col === 'cantidad' &&
          this.tablaPlantilla[i].clave_metrado &&
          this.tablaPlantilla[i].clave_metrado !== 'M'
        ) {
          col = 'descripcion';
        }
        if (col !== key) {
          event.target.blur();
          this.tablaPlantilla[i]['editar' + key] = false;
          this.tablaPlantilla[i]['editar' + col] = true;
          this.handleFormulaDisplay(this.tablaPlantilla[i]?.[col], key, i);
        }
      }
    } else if (event.key === 'ArrowRight') {
      if (target.selectionStart === target.value.length) {
        let col: any = this.sgteColumna(key, true);
        if (
          col === 'descripcion' &&
          this.tablaPlantilla[i].clave_metrado &&
          this.tablaPlantilla[i].clave_metrado !== 'M'
        ) {
          col = 'n_veces';
        }
        if (col !== key) {
          event.target.blur();
          this.tablaPlantilla[i]['editar' + key] = false;
          this.tablaPlantilla[i]['editar' + col] = true;
          this.handleFormulaDisplay(this.tablaPlantilla[i]?.[col], key, i);
        }
      }
    } else if (event.key === '=') {
      setTimeout(() => {
        this.handleFormulaDisplay(event.target.value, key, i);
      }, 0);
    } else if (event.key == 'Delete' || event.key == 'Backspace') {
      setTimeout(() => {
        const valor: any = event.target.value;
        if (!valor.startsWith('=')) {
          if (this.visible2) {
            this.formula = '';
            this.visible2 = false;
            this.filSelVinc = null;
            this.dataGrupoSel = null;
            this.ultimaCelda = null;
          }
          if (this.visible4) {
            this.cerradoModalFormMan();
          }
        }
      }, 0);
    }

    setTimeout(() => {
      if (!target.value) {
        this.visible2 = false;
        this.filSelVinc = null;
        this.dataGrupoSel = null;
        this.ultimaCelda = null;
      }
    }, 0);
  }

  handleFormulaDisplay(valor: any, key: string, index: number) {
    const tipo = this.tablaPlantilla[index].clave_metrado;
    if (typeof valor === 'string' && valor.startsWith('=')) {
      if (tipo !== '' && tipo !== 'M') {
        if (!this.visible4) {
          this.visible2 = true;
          this.formula = valor.slice(1);
        }
        this.visible4 = false;
      } else {
        this.visible2 = false;
        this.filSelVinc = null;
        this.dataGrupoSel = null;
        this.ultimaCelda = null;
        if (!this.visible4) {
          this.visible4 = true;
        }
      }

      this.ultimaCelda = key;
    } else {
      this.visible2 = false;
      this.filSelVinc = null;
      this.dataGrupoSel = null;
      this.ultimaCelda = null;
      this.visible4 = false;
    }
  }

  agregarFila() {
    const obj: Plantilla = {
      altura: '',
      ancho: '',
      cantidad: '',
      clave_metrado: '',
      descripcion: '',
      editardescripcion: false,
      editaraltura: false,
      editarancho: false,
      editarcantidad: false,
      editarclave_metrado: false,
      editarlargo: false,
      editarn_veces: false,
      editartipo: false,
      ind: this.tablaPlantilla.length,
      largo: '',
      n_veces: '',
      id_plantilla: 0,
      tipo: '',
      archivo: '',
      editararchivo: false,
    };
    const inicio = this.filaPlantilla !== null ? this.filaPlantilla + 1 : 0;
    if (inicio > this.tablaPlantilla.length) {
      this.tablaPlantilla.push(obj);
    } else {
      this.tablaPlantilla.splice(inicio, 0, obj);
    }
    this.tablaPlantilla = this.tablaPlantilla.map((obj, index) => ({
      ...obj,
      ind: index,
    }));
  }

  async eliminarFila(ind: number) {
    let conRegistro = false;
    const arrEdit: any = [
      'clave_metrado',
      'tipo',
      'cantidad',
      'n_veces',
      'largo',
      'ancho',
      'altura',
    ];
    for (const element of arrEdit) {
      if (this.tablaPlantilla[element]) {
        conRegistro = true;
        break;
      }
    }
    this.tablaPlantilla.splice(ind, 1);
    if (conRegistro) {
      await this.ajustarNiveles();
      // await this.guardarPlantilla();
      if (this.filPres !== null) {
        // this.eliminarTabGenAlmac(this.filPres);
        await this.actuaPlantillaPres(this.filPres, []);
        this.guardarCambios([this.filPres]);
      }
    }

    this.agregarFila();
    this.tablaPlantilla = this.tablaPlantilla.map((obj, index) => ({
      ...obj,
      ind: index,
    }));
    this.filaPlantilla = null;
  }

  ajustarNiveles() {
    const nuevo = this.tablaPlantilla.reverse();
    const resultado: any[] = [];
    let ultimoMetradoIndex: number | null = null;
    for (const elemento of nuevo) {
      const esValido = Object.keys(elemento).some(
        (key) => elemento[key] !== null && elemento[key] !== ''
      );
      if (!esValido) {
        resultado.push(elemento);
      } else {
        if (elemento.tipo === 'Tit') {
          ultimoMetradoIndex = null;
          resultado.push(elemento);
        } else if (elemento.tipo === 'Met') {
          ultimoMetradoIndex = resultado.length;
          resultado.push(elemento);
        } else if (elemento.tipo === 'Subm') {
          if (
            ultimoMetradoIndex !== null &&
            resultado[ultimoMetradoIndex].tipo === 'Met'
          ) {
            resultado.push(elemento);
          } else {
            elemento.tipo = 'Met';
            elemento.cantidad = 'ACU';
            ultimoMetradoIndex = resultado.length;
            resultado.push(elemento);
          }
        }
      }
    }
    resultado.reverse();
    this.tablaPlantilla = resultado;
  }

  // guardarPlantilla() {
  //   if (
  //     this.tablaPlantilla.length ||
  //     (!this.tablaPlantilla.length && this.filPres !== null)
  //   ) {
  //     const arrobj = [
  //       'clave_metrado',
  //       'tipo',
  //       'descripcion',
  //       'cantidad',
  //       'n_veces',
  //       'largo',
  //       'ancho',
  //       'altura',
  //       'ind',
  //       'id_plantilla',
  //     ];
  //     let str1 = [];
  //     let i = 0;
  //     for (const objeto of this.tablaPlantilla) {
  //       let textArr: any[] = [];
  //       for (let clave of arrobj) {
  //         if (objeto.hasOwnProperty(clave)) {
  //           textArr.push(objeto[clave]);
  //         }
  //       }
  //       const existe = textArr.some((elemento) => elemento !== '');
  //       if (existe) {
  //         const strin1 = textArr.join('|');
  //         str1.push(strin1);
  //         objeto.id_plantilla = i;
  //         i++;
  //       }
  //     }
  //     const string = str1.join('@');
  //     if (this.filPres !== null) {
  //       this.tablaMetrado[this.filPres].plantilla = string;
  //       this.tablaMetrado[this.filPres].ejeactivo = 0;
  //       this.tablaMetrado[this.filPres].detaactivo = 0;
  //       this.guardarVinculos([this.tablaMetrado[this.filPres]], false);
  //     }
  //   }
  // }

  actuaPlantillaPres(filPres: any, tablaPlantilla: any) {
    const arrobj = [
      'clave_metrado',
      'tipo',
      'descripcion',
      'cantidad',
      'n_veces',
      'largo',
      'ancho',
      'altura',
      'ind',
      'id_plantilla',
    ];
    let str1 = [];
    let i = 0;
    let existeFilaValida = false;
    for (const objeto of tablaPlantilla) {
      let textArr: any[] = [];
      for (let clave of arrobj) {
        if (objeto.hasOwnProperty(clave)) {
          textArr.push(objeto[clave]);
        }
      }
      const existe = textArr.some((elemento) => elemento !== '');
      if (existe) {
        const strin1 = textArr.join('|');
        str1.push(strin1);
        if (objeto.clave_metrado) {
          existeFilaValida = true;
          const filtrad: any = this.tablaGenerada.filter(
            (ele: any) => objeto.id_plantilla == ele.item
          );
          for (const fila of filtrad) {
            fila.item = i;
          }
          objeto.id_plantilla = i;
          i++;
        }
      }
    }
    const string = str1.join('@');
    if (filPres !== null) {
      this.tablaMetrado[filPres].plantilla = existeFilaValida ? string : '';

      // this.tablaMetrado[filPres].ejeactivo = 0;
      // this.tablaMetrado[filPres].detaactivo = 0;
      if (!this.tablaMetrado[filPres].plantilla) {
        this.tablaDetalles[filPres] = [];
        this.tablaGenerada = [];
      } else {
        this.tablaDetalles[filPres] = this.tablaGenerada;
      }
    }
  }

  async guardarCambios(filasPresMod: any) {
    let filasPres: any[] = [];
    let filasDetall: any[] = [];
    for (const ind of filasPresMod) {
      filasPres.push(this.tablaMetrado[ind]);
      filasDetall = this.tablaDetalles[ind];
    }
    const datosDetalle = await this.convertirDetalle(filasDetall);
    const datos1 = JSON.stringify(filasPres);
    const datos2 = JSON.stringify(datosDetalle);
    const obj = JSON.stringify({
      id_proyecto: this.id_proyecto,
      id_usuario: this.id_usuario,
      datos1: datos1,
      datos2: datos2,
    });
    const response = await this.consulta.guardarMetradoIfc(obj);
  }

  async blurInput(filPres: any, event: any, i: any, key: any) {
    // let guardar = false;
    event.preventDefault();
    let row = this.tablaPlantilla[i];
    if (row[key] == event.target.value) {
      return;
    }
    this.mostrarPrevPlant = false;
    if (!event.target.value) {
      this.cerradoModalFormMan();
      this.filSelVinc = null;
      this.formula = '';
      this.visible2 = false;
      this.filSelVinc = null;
      this.dataGrupoSel = null;
      this.ultimaCelda = null;
    }

    if (key == 'clave_metrado' || key == 'tipo') {
      if (key == 'clave_metrado') {
        row[key] = event.target.value;
        if (!row.tipo) {
          row.tipo = 'Met';
          row.cantidad = '1';
        }
        //  else {
        if (row.clave_metrado && row.clave_metrado !== 'M') {
          if (row.clave_metrado && row.clave_metrado !== 'M') {
            const ultimoCaracter =
              parseInt(row.clave_metrado.replace(/\D/g, ''), 10) - 1;
            row.descripcion = this.gruposKeys[ultimoCaracter];
            row.cantidad = 'ACU';
          } else {
          }
        } else {
        }
        // }
      } else {
        //tipo
        let antValido = null;
        if (i == 0 && event.target.value == 'Subm') {
          antValido = null;
          this._snackBar.open('Opcion no valida', '', {
            duration: 2000,
            panelClass: ['error-snack-bar'],
          });
          this.tablaPlantilla[i]['editar' + key] = false;
          return;
        } else {
          if (event.target.value == 'Subm') {
            for (let ind = i - 1; i >= 0; ind--) {
              const element = this.tablaPlantilla[ind];
              if (element.tipo && element.tipo !== 'Subm') {
                antValido = element;
                break;
              }
            }
            if (antValido && antValido.tipo !== 'Met') {
              this._snackBar.open('Opcion no valida', '', {
                duration: 2000,
                panelClass: ['error-snack-bar'],
              });
              this.tablaPlantilla[i]['editar' + key] = false;
              return;
            }
            if (antValido) {
              this.tablaPlantilla[antValido.ind].cantidad = '';
              this.tablaPlantilla[antValido.ind].n_veces = '';
              this.tablaPlantilla[antValido.ind].largo = '';
              this.tablaPlantilla[antValido.ind].ancho = '';
              this.tablaPlantilla[antValido.ind].altura = '';
            }
          }
          row[key] = event.target.value;
        }

        if (!row.clave_metrado) {
          row.clave_metrado = 'M';
          row.cantidad = '1';
        }
        if (event.target.value == 'Tit') {
          row.descripcion = '';
          row.cantidad = '';
          row.n_veces = '';
          row.largo = '';
          row.ancho = '';
          row.altura = '';
          for (let ind = 0; ind < this.tablaPlantilla.length; ind++) {
            const element = this.tablaPlantilla[ind];
            if (element.tipo) {
              if (element.tipo !== 'Subm') {
                this.tablaPlantilla[i].tipo == 'Met';
              } else {
                break;
              }
            }
          }
        } else if (event.target.value == 'Met') {
          if (row.clave_metrado && row.clave_metrado !== 'M') {
            const ultimoCaracter =
              parseInt(row.clave_metrado.replace(/\D/g, ''), 10) - 1;
            row.descripcion = this.gruposKeys[ultimoCaracter];
            row.cantidad = 'ACU';
            const filaAnterior = this.buscarFilaAnterior(row);
            if (filaAnterior) {
              filaAnterior.cantidad = 'ACU'; // Actualizar la cantidad de la fila anterior
            }
          }
        } else if (event.target.value == 'Subm') {
          if (row.clave_metrado && row.clave_metrado !== 'M') {
            const ultimoCaracter =
              parseInt(row.clave_metrado.replace(/\D/g, ''), 10) - 1;
            row.descripcion = this.gruposKeys[ultimoCaracter];
            row.cantidad = 'ACU';
          }
        }
      }
    } else {
      if (!row.clave_metrado && !row.tipo) {
        row.tipo = 'Met';
        row.clave_metrado = 'M';
        row.cantidad = '1';
      }
      row[key] = event.target.value;
    }
    this.tablaPlantilla[i]['editar' + key] = false;
    this.mostrarPrevPlant = false;
    this.tablaGenerada = [];
    if (this.filPres !== null) {
      this.tablaDetalles[this.filPres] = [];
    }
    let k = 0;
    for (const element of this.tablaPlantilla) {
      if (element.clave_metrado) {
        element.id_plantilla = k;
        k++;
      }
    }
    await this.actuaPlantillaPres(filPres, this.tablaPlantilla);
    this.guardarCambios([this.filPres]);
    // this.guardarPlantilla();

    // this.eliminarTabGenAlmac(filPres);
  }

  buscarFilaAnterior(
    rowActual: any,
    tablaPlantilla = this.tablaPlantilla
  ): any {
    const indexActual = tablaPlantilla.findIndex(
      (fila: any) => fila === rowActual
    );
    for (let i = indexActual - 1; i >= 0; i--) {
      const fila = tablaPlantilla[i];
      if (fila.clave_metrado) {
        if (fila.tipo === 'Met') {
          return fila;
        } else {
          return null;
        }
      }
    }
    return null;
  }

  // async eliminarTabGenAlmac(filPres: number) {
  //   const indice = this.tablaMetrado[filPres].indice;
  //   const obj = {
  //     id_proyecto: this.id_proyecto,
  //     indice: indice,
  //   };
  //   const respuesta: any = await lastValueFrom(
  //     this.consulta.eliminarDetalleMetradoIfc(obj)
  //   );
  //   if (respuesta[0].id) {
  //     this.tablaDetalles[filPres] = [];
  //     this.tablaGenerada = [];
  //     this.totalPartida = 0;
  //   } else {
  //     console.error('No se elimino colectamente la tabla detalle almacenada');
  //   }
  // }

  async reemplazarFormula(filaPlantilla: any, ultimaCelda: any) {
    if (filaPlantilla !== null && ultimaCelda !== null && this.formula) {
      this.tablaPlantilla[filaPlantilla][ultimaCelda] = '=' + this.formula;
      // this.guardarPlantilla();
      await this.actuaPlantillaPres(this.filPres, this.tablaPlantilla);
      this.guardarCambios([this.filPres]);
      this.mostrarPrevPlant = false;
      this.visible = false;
      this.visible2 = false;
      this.visible3 = false;
      this.visible4 = false;
      this.tablaGenerada = [];
    }
  }

  async reemplazarFormula2(filaPlantilla: any, ultimaCelda: any) {
    if (filaPlantilla !== null && ultimaCelda !== null && this.result) {
      this.tablaPlantilla[filaPlantilla][ultimaCelda] = '=' + this.result;
      await this.actuaPlantillaPres(this.filPres, this.tablaPlantilla);
      this.guardarCambios([this.filPres]);
      this.mostrarPrevPlant = false;
      this.visible = false;
      this.visible2 = false;
      this.visible3 = false;
      this.visible4 = false;
      this.tablaGenerada = [];
    }
  }

  sgteColumna(columna: string, derecha: boolean) {
    let sgte = null;
    switch (columna) {
      case 'descripcion':
        sgte = !derecha ? 'descripcion' : 'cantidad';
        return sgte;
      case 'cantidad':
        sgte = !derecha ? 'descripcion' : 'n_veces';
        return sgte;
      case 'n_veces':
        sgte = !derecha ? 'cantidad' : 'largo';
        return sgte;
      case 'largo':
        sgte = !derecha ? 'n_veces' : 'ancho';
        return sgte;
      case 'ancho':
        sgte = !derecha ? 'largo' : 'altura';
        return sgte;
      case 'altura':
        sgte = !derecha ? 'ancho' : 'altura';
        return sgte;
      default:
        return sgte;
    }
  }

  async verPrevDatPlantilla(cambiar = true) {
    this.buscando3 = true;

    this.filTabGenerada = [];
    this.ultResTabGen = null;
    if (this.ultResTabGen) {
      this.classifier.resetColor(this.ultResTabGen);
      this.ultResTabGen = null;
    }
    if (cambiar) {
      this.mostrarPrevPlant = !this.mostrarPrevPlant;
    }
    this.visible2 = false;
    this.visible4 = false;
    this.filSelVinc = null;
    this.dataGrupoSel = null;
    this.ultimaCelda = null;
    this.tablaGenerada = [];
    setTimeout(async () => {
      if (this.filPres !== null) {
        const fila = this.tablaMetrado[this.filPres];

        if (!this.tablaDetalles[this.filPres].length && fila.plantilla) {
          await this.generarDataPrevisualicion(
            this.tablaPlantilla,
            this.filPres
          );
        } else {
          const tabla = this.tablaDetalles[this.filPres];
          this.tablaGenerada = await this.calculosTotales(tabla);
        }
      }
      this.buscando3 = false;
    }, 50);
  }

  async generarDataPrevisualicion(
    tablaPlantilla: any,
    filPres: any,
    retornar = false
  ) {
    let arrayFinal: any[] = [];
    const filaSel = this.tablaMetrado[filPres];
    let k = 0;
    for (const fila of tablaPlantilla) {
      let arrayDesglosado: any[] = [];
      const clavesNecesarias = [
        'clave_metrado',
        'tipo',
        'descripcion',
        'cantidad',
        'n_veces',
        'largo',
        'ancho',
        'altura',
      ];
      const esValido = clavesNecesarias.some(
        (key) => fila[key] !== null && fila[key] !== ''
      );
      if (esValido) {
        const clave = fila.clave_metrado;
        let sgte = null;
        for (let k = fila.ind + 1; k < tablaPlantilla.length; k++) {
          const element = tablaPlantilla[k];
          const clavesNecesarias = [
            'clave_metrado',
            'tipo',
            'descripcion',
            'cantidad',
            'n_veces',
            'largo',
            'ancho',
            'altura',
          ];
          const esValido: any = clavesNecesarias.some(
            (key) => fila[key] !== null && fila[key] !== ''
          );
          if (esValido) {
            sgte = element;
            break;
          }
        }

        if (
          clave == 'M' ||
          clave == '' ||
          fila.tipo == 'Tit' ||
          (clave &&
            clave !== 'M' &&
            (fila.tipo == 'Tit' ||
              (fila.tipo == 'Met' && sgte?.tipo == 'Subm')))
        ) {
          const metrado: Metrado = {
            descripcion: fila.descripcion,
            esMetrado: fila.tipo == 'Subm' ? 0 : 1,
            item: fila.id_plantilla,
            id_metrado: 0,
            indice: filaSel.indice,
            id_proyecto: this.id_proyecto,
            cantidad: fila.cantidad,
            n_veces:
              fila.n_veces?.charAt(0) === '='
                ? fila.n_veces.substring(1)
                : fila.n_veces,
            largo:
              fila.largo?.charAt(0) === '='
                ? fila.largo.substring(1)
                : fila.largo,
            ancho:
              fila.ancho?.charAt(0) === '='
                ? fila.ancho.substring(1)
                : fila.ancho,
            altura:
              fila.altura?.charAt(0) === '='
                ? fila.altura.substring(1)
                : fila.altura,
            parcial: '',
            subtotal: '',
            tieneAceros: 0,
            tieneSubmetrado: 0,
            estitulo: fila.tipo == 'Tit' ? 1 : 0,
            archivo: '',
            estilo: '',
            id_padre: '',
            ind: 0,
            toggle: false,
            mostrar: true,
            detalle: '',
            ejes: '',
            checked: false,
            editardetalle: false,
            editarejes: false,
            fragmentId: '',
          };
          arrayFinal.push(metrado);
        } else {
          // if ()
          let indice = null;
          const match = clave.match(/\d+/);
          if (match) {
            indice = parseInt(match[0]) - 1;
          }
          let arr: any[] = [];
          if (indice !== null) {
            arr = this.gruposVinc[this.gruposKeys[indice]];
            arrayDesglosado = await this.genDatFilPlant(
              fila,
              arr,
              filaSel,
              indice
            );
            // let j = 0;

            // for (const element of arr) {
            //   const map = await this.busquedaFragmentos(
            //     element.informacion.expressID
            //   );
            //   // const globalId = this.gruposGlobalIds[k][j]
            //   const data = await this.verInfoVincu(indice, j, true);
            //   var valorCantidad = '1';
            //   let valorn_veces: any = null; // Inicialización segura
            //   let valorlargo: any = null;
            //   let valorancho: any = null;
            //   let valoraltura: any = null;
            //   if (fila.n_veces) {
            //     valorn_veces = await this.evaluarTexto(data, fila.n_veces);
            //     // n_vecesRep = fila.n_veces.charAt(0) === '=' ? true : false;
            //   }
            //   if (fila.largo) {
            //     valorlargo = await this.evaluarTexto(data, fila.largo);
            //     // largoRep = fila.largo.charAt(0) === '=' ? true : false;
            //   }
            //   if (fila.ancho) {
            //     valorancho = await this.evaluarTexto(data, fila.ancho);
            //     // anchoRep = fila.ancho.charAt(0) === '=' ? true : false;
            //   }
            //   if (fila.altura) {
            //     valoraltura = await this.evaluarTexto(data, fila.altura);
            //     // alturaRep = fila.altura.charAt(0) === '=' ? true : false;
            //   }

            //   const metrado: Metrado = {
            //     descripcion: data?.Name,
            //     esMetrado: fila.tipo == 'Subm' ? 0 : 1,
            //     item: fila.id_plantilla,
            //     id_metrado: 0,
            //     indice: filaSel.indice,
            //     id_proyecto: this.id_proyecto,
            //     cantidad: valorCantidad !== null ? valorCantidad : '',
            //     n_veces: valorn_veces !== null ? valorn_veces : '',
            //     largo: valorlargo !== null ? valorlargo : '',
            //     ancho: valorancho !== null ? valorancho : '',
            //     altura: valoraltura !== null ? valoraltura : '',
            //     parcial: '',
            //     subtotal: '',
            //     tieneAceros: 0,
            //     tieneSubmetrado: 0,
            //     estitulo: fila.tipo == 'Tit' ? 1 : 0,
            //     archivo: '',
            //     estilo: '',
            //     id_padre: '',
            //     ind: 0,
            //     toggle: false,
            //     mostrar: true,
            //     detalle: '',
            //     ejes: '',
            //     checked: false,
            //     editardetalle: false,
            //     editarejes: false,
            //     fragmentId: map ? map : '',
            //   };
            //   arrayDesglosado.push(metrado);
            //   j++;
            // }

            if (fila.cantidad == 'DET') {
              arrayFinal = arrayFinal.concat(arrayDesglosado);
            } else {
              const noRepetidos = await this.dataAcumFilPlant(
                arrayDesglosado,
                fila,
                filaSel
              );

              arrayFinal = arrayFinal.concat(noRepetidos);
            }
          }
        }
      }
      k++;
    }
    arrayFinal = arrayFinal.map((item, index) => ({
      ...item,
      ind: index,
      id_metrado: index,
    }));
    arrayFinal = await this.calculosTotales(arrayFinal);
    if (!retornar) {
      this.tablaGenerada = arrayFinal;
      if (this.filPres !== null) {
        this.tablaDetalles[this.filPres] = arrayFinal;
      }

      // await this.guardarDetalle(
      //   this.tablaGenerada,
      //   filaSel.indice,
      //   false,
      //   filPres
      // );
      this.guardarCambios([this.filPres]);
      return this.tablaGenerada;
    } else {
      return arrayFinal;
    }
  }

  async genDatFilPlant(fila: any, arr: any, filaSel: any, indice: any) {
    let arrayDesglosado = [];
    let j = 0;
    for (const element of arr) {
      const map = await this.busquedaFragmentos(element.informacion.expressID);
      // const globalId = this.gruposGlobalIds[k][j]
      const data = await this.verInfoVincu(indice, j, true);
      var valorCantidad = '1';
      let valorn_veces: any = null; // Inicialización segura
      let valorlargo: any = null;
      let valorancho: any = null;
      let valoraltura: any = null;
      if (fila.n_veces) {
        valorn_veces = await this.evaluarTexto(data, fila.n_veces);
        // n_vecesRep = fila.n_veces.charAt(0) === '=' ? true : false;
      }
      if (fila.largo) {
        valorlargo = await this.evaluarTexto(data, fila.largo);
        // largoRep = fila.largo.charAt(0) === '=' ? true : false;
      }
      if (fila.ancho) {
        valorancho = await this.evaluarTexto(data, fila.ancho);
        // anchoRep = fila.ancho.charAt(0) === '=' ? true : false;
      }
      if (fila.altura) {
        valoraltura = await this.evaluarTexto(data, fila.altura);
        // alturaRep = fila.altura.charAt(0) === '=' ? true : false;
      }

      const metrado: Metrado = {
        descripcion: data?.Name,
        esMetrado: fila.tipo == 'Subm' ? 0 : 1,
        item: fila.id_plantilla,
        id_metrado: 0,
        indice: filaSel.indice,
        id_proyecto: this.id_proyecto,
        cantidad: valorCantidad !== null ? valorCantidad : '',
        n_veces: valorn_veces !== null ? valorn_veces : '',
        largo: valorlargo !== null ? valorlargo : '',
        ancho: valorancho !== null ? valorancho : '',
        altura: valoraltura !== null ? valoraltura : '',
        parcial: '',
        subtotal: '',
        tieneAceros: 0,
        tieneSubmetrado: 0,
        estitulo: fila.tipo == 'Tit' ? 1 : 0,
        archivo: '',
        estilo: '',
        id_padre: '',
        ind: 0,
        toggle: false,
        mostrar: true,
        detalle: '',
        ejes: '',
        checked: false,
        editardetalle: false,
        editarejes: false,
        fragmentId: map ? map : '',
      };
      arrayDesglosado.push(metrado);
      j++;
    }
    return arrayDesglosado;
  }

  async dataAcumFilPlant(arrayDesglosado: any, fila: any, filaSel: any) {
    let noRepetidos: any[] = [];

    for (const element of arrayDesglosado) {
      let agregar = false;
      if (!noRepetidos.length) {
        // element.cantidad = '1';
        // noRepetidos.push(element);
        agregar = true;
      } else {
        const existe = noRepetidos.find(
          (ele) =>
            element['n_veces'] == ele['n_veces'] &&
            element['largo'] === ele['largo'] &&
            element['ancho'] === ele['ancho'] &&
            element['altura'] === ele['altura']
        );

        if (existe) {
          existe.cantidad = (Number(existe.cantidad) + 1).toString();
          let mapAcum: any = existe.fragmentId ? existe.fragmentId : {};
          const addToSet = (uuid: string, value: any) => {
            if (value instanceof Set) {
              value.forEach((val) => addToSet(uuid, val));
            } else {
              if (!mapAcum[uuid]) {
                mapAcum[uuid] = new Set();
              }
              mapAcum[uuid].add(value);
            }
          };
          Object.entries(element.fragmentId).forEach(
            ([uuid, value]: [string, any]) => {
              addToSet(uuid, value);
            }
          );
          existe.fragmentId = mapAcum;
        } else {
          agregar = true;
        }
      }
      if (agregar) {
        const metrado: Metrado = {
          descripcion: fila.descripcion,
          esMetrado: fila.tipo == 'Subm' ? 0 : 1,
          item: fila.id_plantilla,
          id_metrado: 0,
          indice: filaSel.indice,
          id_proyecto: this.id_proyecto,
          cantidad: '1',
          n_veces: element.n_veces ? element.n_veces : '',
          largo: element.largo ? element.largo : '',
          ancho: element.ancho ? element.ancho : '',
          altura: element.altura ? element.altura : '',
          parcial: '',
          subtotal: '',
          tieneAceros: 0,
          tieneSubmetrado: 0,
          estitulo: fila.tipo == 'Tit' ? 1 : 0,
          archivo: '',
          estilo: '',
          id_padre: '',
          ind: 0,
          toggle: false,
          mostrar: true,
          detalle: '',
          ejes: '',
          checked: false,
          editardetalle: false,
          editarejes: false,
          fragmentId: element.fragmentId,
        };
        noRepetidos.push(metrado);
      }
    }
    return noRepetidos;
  }

  evaluarSgte(tipo: any, i: any) {
    let sgteValido = true;
    if (tipo == 'Met') {
      if (i < this.tablaPlantilla.length - 1) {
        for (let ind = Number(i) + 1; ind < this.tablaPlantilla.length; ind++) {
          const fila = this.tablaPlantilla[ind];
          const clavesNecesarias = [
            'clave_metrado',
            'tipo',
            'descripcion',
            'cantidad',
            'n_veces',
            'largo',
            'ancho',
            'altura',
          ];
          const esValido: any = clavesNecesarias.some(
            (key) => fila[key] !== null && fila[key] !== ''
          );
          if (esValido && fila.tipo == 'Subm') {
            sgteValido = false;
            break;
          }
        }
      }
    }
    return sgteValido;
  }

  async evaluarTexto(row: any, texto: string) {
    const arrayValues: {
      [key: string]: string;
    } = {
      A1: 'guid',
      A2: 'nivel',
      A3: 'clase',
      A4: 'Name',
      A5: 'ObjectType',
      A6: 'Tag',
      B1: 'boundingboxlength',
      B2: 'boundingboxwidth',
      B3: 'boundingboxheight',
      C1: 'AreaMaxima',
      C2: 'Thickness',
      C3: 'AreaTotal',
      C4: 'volumen',
    };

    if (texto.charAt(0) === '=') {
      const textSinIg = texto.slice(1).trim();
      if (!textSinIg) {
        return texto;
      }
      const variables = textSinIg.match(/[A-Za-z0-9]+/g) || [];
      let valores: any = {};
      variables.map((ele: string) => {
        const valor = ele.toUpperCase();
        if (arrayValues[valor]) {
          valores[valor] = row[arrayValues[valor]];
        } else {
          valores[valor] = '';
        }
      });
      // const textoConValores = textSinIg.replace(/[A-Za-z0-9]+/g, (match) => {
      //   const valor = match.toUpperCase();
      //   if (valores[valor] !== undefined ) {
      //     return valores[valor].toString();
      //   } else if ((typeof Number(valor) === 'number' && !isNaN(Number(valor))))  {
      //     return valor
      //   } else {
      //     return '&%';
      //   }
      // });
      const textoConValores = textSinIg.replace(
        /\b[A-Za-z]+\d*\b/g,
        (match) => {
          const valor = match.toUpperCase();
          if (valores[valor] !== undefined) {
            return valores[valor].toString();
          }
          return '&%';
        }
      );

      if (textoConValores.includes('&%')) {
        return '';
      }

      try {
        const autoCompleteMultiplication = (expression: string): string => {
          return expression.replace(/(\d+(\.\d+)?)\s*\(/g, '$1*(');
        };
        const formattedExpression = autoCompleteMultiplication(textoConValores);
        const resultado = eval(formattedExpression);
        const redondeado = await this.consulta.redondeo(
          resultado,
          Number(this.decimales)
        );
        return redondeado;
      } catch (error) {
        console.error('Error al evaluar la expresión:', error);
        return '';
      }
    } else {
      return texto;
    }
  }

  async limpiarPlantilla() {
    if (this.filPres !== null) {
      this.tablaMetrado[this.filPres].plantilla = '';
      this.tablaPlantilla = [];
      this.tablaDetalles[this.filPres] = [];
      // this.guardarPlantilla();
      const tabla = await this.completarArray([], 10);
      this.crearTablaPlantilla2(tabla);
      //
      this.guardarCambios([this.filPres]);
      this.mostrarPrevPlant = false;
      this.ultimaCelda = null;
      this.visible2 = false;
      this.filSelVinc = null;
      this.dataGrupoSel = null;
      this.ultimaCelda = null;
    }
  }

  cerradoModalGrup() {
    if (this.resalListaGrup) {
      this.classifier.resetColor(this.resalListaGrup);
      this.resalListaGrup = null;
    }
    this.resalListaGrup = null;
  }

  async verInfoVincu(grupo: any, ele: any, retornar = false) {
    if (this.resalListaGrup) {
      this.classifier.resetColor(this.resalListaGrup);
      this.resalListaGrup = null;
    }
    const concatenado: any = {};
    function addToSet(uuid: string, value: any) {
      if (value instanceof Set) {
        value.forEach((val) => addToSet(uuid, val));
      } else {
        concatenado[uuid].add(value);
      }
    }
    this.filSelVinc = grupo + '-' + (ele !== null ? ele : '');
    const key = this.gruposKeys[grupo];
    const valor = this.gruposVinc[key];
    let data = null;
    let map = null;
    if (ele == null) {
      data = valor[0];
      for (const element of valor) {
        const fragmentMap = await this.busquedaFragmentos(
          element.informacion.expressID
        );
        if (!map) {
          map = fragmentMap;
        }
        if (fragmentMap) {
          Object.entries(fragmentMap).forEach(
            ([uuid, value]: [string, any]) => {
              if (!concatenado[uuid]) {
                concatenado[uuid] = new Set();
              }
              addToSet(uuid, value);
            }
          );
        }
      }
    } else {
      data = valor[ele];
      map = await this.busquedaFragmentos(data.informacion.expressID);
      if (map) {
        Object.entries(map).forEach(([uuid, value]: [string, any]) => {
          if (!concatenado[uuid]) {
            concatenado[uuid] = new Set();
          }
          addToSet(uuid, value);
        });
      }
    }
    if (concatenado && Object.keys(concatenado).length !== 0) {
      const color = new THREE.Color(0xe7aa26);
      this.classifier.setColor(concatenado, color);
      this.resalListaGrup = concatenado;
    }
    const datainfo = await this.verBounding(map);
    let proyecto = '';
    let nivel = '';
    for (let i = data.ind; i >= 0; i--) {
      const element = this.dataIFC[i];
      if (element.nivel == 0 && !proyecto) {
        proyecto = element.informacion?.Name?.value;
        break;
      } else if (element.nivel == 3 && !nivel) {
        nivel = element.informacion?.Name?.value;
      }
    }
    const obj = {
      guid: proyecto,
      nivel: nivel,
      ObjectType: data.informacion.ObjectType.value,
      clase: data.informacion.clase,
      Name: data.informacion.Name.value,
      Tag: data.informacion.Tag.value,
      boundingboxlength: this.consulta.redondeo(
        Number(datainfo.boundingboxlength),
        Number(this.decimales)
      ),
      boundingboxwidth: this.consulta.redondeo(
        Number(datainfo.boundingboxwidth),
        Number(this.decimales)
      ),
      boundingboxheight: this.consulta.redondeo(
        Number(datainfo.boundingboxheight),
        Number(this.decimales)
      ),
      AreaMaxima: this.consulta.redondeo(
        Number(datainfo.AreaMaxima),
        Number(this.decimales)
      ),
      Thickness: this.consulta.redondeo(
        Number(datainfo.Thickness),
        Number(this.decimales)
      ),
      AreaTotal: this.consulta.redondeo(
        Number(datainfo.AreaTotal),
        Number(this.decimales)
      ),
      volumen: this.consulta.redondeo(
        Number(datainfo.volumen),
        Number(this.decimales)
      ),
    };
    if (retornar) {
      return obj;
    } else {
      this.dataGrupoSel = obj;
      return null;
    }
  }

  cerrarOverlay(arriba: number, overlayPanel: any) {
    if (!this.nroFilas && typeof this.nroFilas !== 'number') {
      return;
    }
    let inicio = null;
    const obj: Plantilla = {
      altura: '',
      ancho: '',
      cantidad: '',
      clave_metrado: '',
      descripcion: '',
      editardescripcion: false,
      editaraltura: false,
      editarancho: false,
      editarcantidad: false,
      editarclave_metrado: false,
      editarlargo: false,
      editarn_veces: false,
      editartipo: false,
      ind: this.tablaPlantilla.length,
      largo: '',
      n_veces: '',
      id_plantilla: 0,
      tipo: '',
      archivo: '',
      editararchivo: false,
    };
    let array = [];
    if (!arriba) {
      if (this.filaPlantilla == null) {
        inicio = this.tablaPlantilla.length;
      } else {
        inicio = this.filaPlantilla !== null ? this.filaPlantilla + 1 : 0;
      }
    } else {
      inicio = this.filaPlantilla !== null ? this.filaPlantilla : 0;
    }
    for (let i = 0; i < this.nroFilas; i++) {
      array.push(obj);
    }
    if (inicio < this.tablaPlantilla.length) {
      this.tablaPlantilla.splice(inicio, 0, ...array);
      this.filaPlantilla = inicio + array.length;
    } else {
      this.tablaPlantilla = [...this.tablaPlantilla, ...array];
    }
    this.tablaPlantilla = this.tablaPlantilla.map((obj, index) => ({
      ...obj,
      ind: index,
    }));
    this.nroFilas = 1;
    overlayPanel.hide();
  }

  async bajarNivel(ind: number) {
    const fila = this.tablaPlantilla[ind];
    if (fila.tipo) {
      let antValido = null;
      const inicio = ind - 1;
      for (let i = inicio; ind >= 0; i--) {
        const element = this.tablaPlantilla[i];
        const esValido = Object.keys(element).some(
          (key) => element[key] !== null && element[key] !== ''
        );
        if (esValido) {
          antValido = element;
          break;
        }
      }
      if (fila.tipo == 'Met') {
        if (antValido && antValido?.tipo !== 'Tit') {
          this.tablaPlantilla[ind].tipo = 'Subm';
          await this.ajustarNiveles();
          // this.guardarPlantilla();
          await this.actuaPlantillaPres(this.filPres, this.tablaPlantilla);
          this.guardarCambios([this.filPres]);
        }
      } else if (fila.tipo == 'Subm') {
      } else if (fila.tipo == 'Tit') {
        this.tablaPlantilla[ind].tipo = 'Met';
        // this.guardarPlantilla();
        await this.actuaPlantillaPres(this.filPres, this.tablaPlantilla);
        this.guardarCambios([this.filPres]);
      } else {
        this._snackBar.open('Opcion no valida', '', {
          duration: 2000,
          panelClass: ['error-snack-bar'],
        });
      }
    } else {
      this._snackBar.open('Opcion no valida', '', {
        duration: 2000,
        panelClass: ['error-snack-bar'],
      });
    }
  }

  async subirNivel(ind: number) {
    const fila = this.tablaPlantilla[ind];
    if (fila.tipo) {
      let antValido = null;
      const inicio = ind - 1;
      for (let i = inicio; ind >= 0; i--) {
        const element = this.tablaPlantilla[i];
        const esValido = Object.keys(element).some(
          (key) => element[key] !== null && element[key] !== ''
        );
        if (esValido) {
          antValido = element;
          break;
        }
      }
      if (fila.tipo == 'Met') {
        this.tablaPlantilla[ind].tipo = 'Tit';
        await this.ajustarNiveles();
        // this.guardarPlantilla();
        await this.actuaPlantillaPres(this.filPres, []);
        this.guardarCambios([this.filPres]);
      } else if (fila.tipo == 'Subm') {
        this.tablaPlantilla[ind].tipo = 'Met';
        await this.ajustarNiveles();
        // this.guardarPlantilla();
        await this.actuaPlantillaPres(this.filPres, []);
        this.guardarCambios([this.filPres]);
      } else if (fila.tipo == 'Tit') {
      } else {
        this._snackBar.open('Opcion no valida', '', {
          duration: 2000,
          panelClass: ['error-snack-bar'],
        });
      }
    } else {
      this._snackBar.open('Opcion no valida', '', {
        duration: 2000,
        panelClass: ['error-snack-bar'],
      });
    }
  }

  subirGrupo(ind: number) {
    const fila = this.tablaPlantilla[ind];
    const tipo = this.tablaPlantilla[ind].tipo;
    const clave = this.tablaPlantilla[ind].clave_metrado;
    let anterior = null;
    let sgte = null;
    for (let i = ind + 1; i < this.tablaPlantilla.length; i++) {
      const element = this.tablaPlantilla[i];
      const esValido = Object.keys(element).some(
        (key) => element[key] !== null && element[key] !== ''
      );
      if (esValido) {
        sgte = element;
        break;
      }
    }

    for (let i = ind - 1; i >= 0; i--) {
      const element = this.tablaPlantilla[i];
      const esValido = Object.keys(element).some(
        (key) => element[key] !== null && element[key] !== ''
      );
      if (esValido) {
        anterior = element;
        break;
      }
    }
  }

  bajarGrupo(ind: number) {}

  copyToClipboard(archivo: any) {
    navigator.clipboard
      .writeText(archivo)
      .then(() => {
        alert('URL copiada al portapapeles');
      })
      .catch(() => {
        alert('Error al copiar la URL');
      });
  }

  async guardarUrl(event: any, i: any) {
    this.tablaPlantilla[i].archivo = event.target.value;
    this.imagen = this.tablaPlantilla[i].archivo;
    this.imagenInvalida = false; // Reiniciar estado al ingresar nueva URL
    // this.guardarPlantilla();
    await this.actuaPlantillaPres(this.filPres, this.tablaPlantilla);
    this.guardarCambios([this.filPres]);
  }

  verFilaValid(row: any) {
    const arrobj = [
      'clave_metrado',
      'tipo',
      'descripcion',
      'cantidad',
      'n_veces',
      'largo',
      'ancho',
      'altura',
    ];
    const existe = arrobj.some(
      (key) => row[key] !== '' && row[key] !== null && row[key] !== undefined
    );
    if (existe) {
      return true;
    } else {
      return false;
    }
  }

  toggle(row: any, i: number) {
    const convertir = !row.toggle;
    const mostrar = convertir ? false : true;
    this.tablaGenerada[i].toggle = convertir;
    if (i > this.tablaGenerada.length - 1) {
      return;
    }
    if (row.estitulo) {
      for (let j = i + 1; j < this.tablaGenerada.length; j++) {
        const element = this.tablaGenerada[j];
        if (element.esMetrado && element.estitulo) {
          break;
        } else {
          this.tablaGenerada[j].toggle = convertir;
          this.tablaGenerada[j].mostrar = mostrar;
        }
      }
    } else if (row.esMetrado) {
      for (let j = i + 1; j < this.tablaGenerada.length; j++) {
        const element = this.tablaGenerada[j];
        if (element.esMetrado && !element.estitulo) {
          break;
        } else {
          this.tablaGenerada[j].toggle = convertir;
          this.tablaGenerada[j].mostrar = mostrar;
        }
      }
    }
  }

  toggleOn(row: any, i: number) {}

  verImagen(row: any, i: number) {
    this.visible3 = true;
    if (this.verFilaValid(row)) {
      if (row.archivo) {
        this.imagen = row.archivo;
      } else {
        this.imagen = '';
      }
    } else {
      this.visible3 = false;
    }
  }

  calculosTotales(tabla: any) {
    this.totalPartida = 0;
    function esNumero(valor: any) {
      return typeof Number(valor) === 'number' && !isNaN(valor);
    }
    tabla.reverse();
    let acumGrupo = 0;
    let tieneSub = false;
    let totalPartida = 0;
    for (const element of tabla) {
      if (!element.esMetrado && !element.estitulo) {
        let totalFila = 0;
        if (
          (element.cantidad && esNumero(element.cantidad)) ||
          (element.n_veces && esNumero(element.n_veces)) ||
          (element.largo && esNumero(element.largo)) ||
          (element.ancho && esNumero(element.ancho)) ||
          (element.altura && esNumero(element.altura))
        ) {
          const cantidad =
            element.cantidad && esNumero(element.cantidad)
              ? Number(element.cantidad)
              : 1;
          const n_veces =
            element.n_veces && esNumero(element.n_veces)
              ? Number(element.n_veces)
              : 1;
          const largo =
            element.largo && esNumero(element.largo)
              ? Number(element.largo)
              : 1;
          const ancho =
            element.ancho && esNumero(element.ancho)
              ? Number(element.ancho)
              : 1;
          const altura =
            element.altura && esNumero(element.altura)
              ? Number(element.altura)
              : 1;
          totalFila = cantidad * n_veces * largo * ancho * altura;
        }

        acumGrupo = acumGrupo + totalFila;
        tieneSub = true;
        element.parcial = this.consulta.redondeo(
          totalFila,
          Number(this.decimales)
        );
        element.subtotal = this.consulta.redondeo(
          totalFila,
          Number(this.decimales)
        );
      } else if (element.esMetrado && !element.estitulo) {
        let totalFila = 0;
        if (
          (element.cantidad && esNumero(element.cantidad)) ||
          (element.n_veces && esNumero(element.n_veces)) ||
          (element.largo && esNumero(element.largo)) ||
          (element.ancho && esNumero(element.ancho)) ||
          (element.altura && esNumero(element.altura))
        ) {
          const cantidad =
            element.cantidad && esNumero(element.cantidad)
              ? Number(element.cantidad)
              : 1;
          const n_veces =
            element.n_veces && esNumero(element.n_veces)
              ? Number(element.n_veces)
              : 1;
          const largo =
            element.largo && esNumero(element.largo)
              ? Number(element.largo)
              : 1;
          const ancho =
            element.ancho && esNumero(element.ancho)
              ? Number(element.ancho)
              : 1;
          const altura =
            element.altura && esNumero(element.altura)
              ? Number(element.altura)
              : 1;
          totalFila = cantidad * n_veces * largo * ancho * altura;
        }
        if (tieneSub) {
          element.cantidad = '';
          element.tieneSubmetrado = 1;
          element.subtotal = this.consulta.redondeo(
            acumGrupo,
            Number(this.decimales)
          );
          totalPartida = totalPartida + Number(element.subtotal);
        } else {
          element.subtotal = this.consulta.redondeo(
            totalFila,
            Number(this.decimales)
          );
          totalPartida = totalPartida + Number(element.subtotal);
        }
        element.parcial = this.consulta.redondeo(
          totalFila,
          Number(this.decimales)
        );

        acumGrupo = 0;
        tieneSub = false;
      }
    }
    this.totalPartida = totalPartida;
    tabla.reverse();
    return tabla;
  }

  agregarFormula(codigo: string) {
    if (!this.formula.includes(codigo)) {
      this.formula += this.formula ? '+' + codigo : codigo;
    }
  }

  cerradoModalFormMan() {
    this.restaurarColoresVolumen(this.selectedFragments);
    this.visible4 = false;
    this.formulaManual = '';
    this.result = '';
    this.highlighter.clear();
    // this.highlighter.dispose();
    // this.highlighter.enabled = false;
    if (this.face.enabled) {
      this.face?.deleteAll();
      // this.face.dispose();
      this.face.enabled = false;
    }
    if (this.dimensions.enabled) {
      this.dimensions?.deleteAll();
      // this.dimensions.dispose();
      this.dimensions.enabled = false;
    }
    if (this.volumen.enabled) {
      this.volumen?.deleteAll();
      // this.volumen.dispose();
      this.volumen.enabled = false;
    }
    if (this.clipper.enabled) {
      this.clipper?.deleteAll();
      // this.clipper.dispose();
      this.clipper.enabled = false;
    }
    if (this.area.enabled) {
      this.area?.deleteAll();
      // this.area.dispose();
      this.area.enabled = false;
    }
    if (this.longitud.enabled) {
      this.longitud?.deleteAll();
      // this.longitud.dispose();
      this.longitud.enabled = false;
    }

    const selectColor = new THREE.Color(0x5a3994); // color hover
    const hoverColor = new THREE.Color(0xe6f34a); // color selecccionado
    this.highlighter.colors.set('hover', hoverColor);
    this.highlighter.colors.set('select', selectColor);
    this.verVolumen = false;
    this.selectedFragments = {};
    this.coloresRestaurarVol = [];
    this.acumuladosVolumen = [];
    this.acumuladosArea = [];
    this.acumuladosPerimetro = [];
    this.capturarArea = false;
    this.capturarLongitud = false;
    this.capturarVolumen = false;
    this.capturarPerimetro = false;
    this.tipoManualData = false;
    this.eliminarMeshesCreados();
    this.highlighter.enabled = true;
  }

  seleccionMenuManual2(tipo: string) {
    const opciones: string[] = [
      'capturarArea',
      'capturarPerimetro',
      'capturarVolumen',
      'capturarLongitud',
    ];

    if (opciones.includes(tipo)) {
      const observer = new MutationObserver((mutations) => {
        setTimeout(() => {
          document.querySelectorAll('[draggable]').forEach((el) => {
            const elem = el as HTMLElement;
            if (elem.innerHTML.trim() || elem.innerText.trim()) {
              elem.style.padding = '3px';
              elem.style.fontSize = '9px';
              elem.style.width = '38px';
              elem.style.height = '16px';
            } else {
              elem.style.padding = '3px';
              elem.style.fontSize = '9px';
            }
          });
        }, 0);
      });
      observer.observe(document.body, { childList: true, subtree: true });

      this.highlighter.clear();

      // this.dimensions.dispose()
      this.volumen?.deleteAll();
      this.volumen.clear();

      // this.volumen.dispose()
      this.highlighter.enabled = false;
      // this.highlighter.dispose()
      this.formulaManual = '';
      this.result = '';
      this.restaurarColoresVolumen(this.selectedFragments);
      this.selectedFragments = {};
      this.coloresRestaurarVol = [];
      this.acumuladosVolumen = [];
      this.acumuladosArea = [];
      this.acumuladosPerimetro = [];
      if (tipo !== 'capturarArea') {
        this.face?.deleteAll();
        this.area?.deleteAll();
        this.face.enabled = false;
        this.area.enabled = false;
      }
      if (tipo !== 'capturarLongitud') {
        this.longitud?.deleteAll();
        this.dimensions?.deleteAll();
        this.longitud.enabled = false;
        this.dimensions.enabled = false;
      }
      for (const opcion of opciones) {
        if (opcion !== tipo) {
          (this as any)[opcion] = false;
        } else {
          (this as any)[opcion] = true;
          if (tipo == 'capturarArea') {
            this.highlighter.enabled = false;
            this.highlighter.clear();
            if (this.tipoManualData) {
              this.area.enabled = true;
              this.crearSegmentosArea();
              this.face.enabled = false;
            } else {
              this.highlighter.enabled = true;
              this.area.enabled = false;
              this.face.enabled = true;
            }
          } else if (tipo == 'capturarPerimetro') {
            this.face.enabled = true;
          } else if (tipo == 'capturarVolumen') {
            this.highlighter.enabled = true;
            this.verVolumen = true;
          } else if (tipo == 'capturarLongitud') {
            this.dimensions.enabled = true;
            if (this.container) {
              this.container.ondblclick = async () => {
                const creado = await this.dimensions.create();
              };
            }
          }
        }
      }
    }
  }

  seleccionMenuManual(tipo: string) {
    this.limpiarTodo();
    const observer = new MutationObserver((mutations) => {
      setTimeout(() => {
        document.querySelectorAll('[draggable]').forEach((el) => {
          const elem = el as HTMLElement;
          if (elem.innerHTML.trim() || elem.innerText.trim()) {
            elem.style.padding = '3px';
            elem.style.fontSize = '9px';
            elem.style.width = '38px';
            elem.style.height = '16px';
          } else {
            elem.style.padding = '3px';
            elem.style.fontSize = '9px';
          }
        });
      }, 0);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // const opciones: string[] = [
    //   'capturarArea',
    //   'capturarPerimetro',
    //   'capturarVolumen',
    //   'capturarLongitud',
    // ];

    (this as any)[tipo] = true;
    if (tipo == 'capturarArea') {
      if (this.tipoManualData) {
        this.area.enabled = true;
        if (this.container) {
          this.container.ondblclick = () => this.area.create();
          this.container.oncontextmenu = () => this.area.endCreation();
        }
      } else {
        this.highlighter.enabled = true;
        this.face.enabled = true;
      }
    } else if (tipo == 'capturarPerimetro') {
      this.face.enabled = true;
    } else if (tipo == 'capturarVolumen') {
      this.highlighter.enabled = true;
      this.verVolumen = true;
    } else if (tipo == 'capturarLongitud') {
      this.dimensions.enabled = true;
      if (this.container) {
        this.container.ondblclick = async () => {
          const creado = await this.dimensions.create();
        };
      }
    }
  }

  limpiarTodo() {
    this.face.deleteAll();
    this.face.enabled = false;
    this.area.deleteAll();
    this.area.enabled = false;
    this.highlighter.clear();
    this.highlighter.enabled = false;
    this.dimensions.deleteAll();
    this.dimensions.enabled = false;
    this.volumen.deleteAll();
    this.volumen.enabled = false;
    this.formulaManual = '';
    this.result = '';
    this.restaurarColoresVolumen(this.selectedFragments);
    this.selectedFragments = {};
    this.coloresRestaurarVol = [];
    this.acumuladosVolumen = [];
    this.acumuladosArea = [];
    this.acumuladosPerimetro = [];
    this.capturarArea = false;
    this.capturarLongitud = false;
    this.capturarVolumen = false;
    this.capturarPerimetro = false;
  }

  @HostListener('dblclick')
  async onDoubleClick() {
    if (this.paso == 2 && this.visible4) {
      if (this.capturarArea) {
        if (!this.tipoManualData) {
          if (this.container) {
            this.face.create();
            const selecciones = this.face.selection;
            if (selecciones.length) {
              const target =
                selecciones[selecciones.length - 1].label.three.position;
              const area = this.consulta.redondeo(
                selecciones[selecciones.length - 1].area,
                3
              );
              setTimeout(() => {
                const exist = this.acumuladosArea.find(
                  (ele) =>
                    ele.x === target.x &&
                    ele.y === target.y &&
                    ele.z === target.z
                );
                if (exist) {
                } else {
                  this.acumuladosArea.push(target);
                  this.formulaManual += this.formulaManual ? '+' + area : area;
                  this.calculateFormula();
                }
              });
              const material =
                selecciones[selecciones.length - 1].mesh.material;
              const redondeado = this.consulta.redondeo(
                selecciones[selecciones.length - 1].area,
                3
              );

              (
                selecciones[selecciones.length - 1].label.three
                  .element as HTMLElement
              ).innerHTML = redondeado;
              (
                selecciones[selecciones.length - 1].label.three
                  .element as HTMLElement
              ).innerText = redondeado;
              // (
              //   selecciones[selecciones.length - 1].label.three
              //     .element as HTMLElement
              // ).style.width = '29px';
              // (
              //   selecciones[selecciones.length - 1].label.three
              //     .element as HTMLElement
              // ).style.height = '16px';
              // (
              //   selecciones[selecciones.length - 1].label.three
              //     .element as HTMLElement
              // ).style.fontSize = '9px';
              // (
              //   selecciones[selecciones.length - 1].label.three
              //     .element as HTMLElement
              // ).style.padding = '3px';
              if (material instanceof THREE.MeshBasicMaterial) {
                const antcolor = material.color;
                material.userData['colorAnterior'] = antcolor;
                material.color.set('#FF0000');
              }
            }
          }
        } else {
        }
      } else if (this.capturarPerimetro) {
        if (this.container) {
          this.face.create();
          const selecciones = this.face.selection;

          if (selecciones.length) {
            const target =
              selecciones[selecciones.length - 1].label.three.position;
            const perimeter = this.consulta.redondeo(
              selecciones[selecciones.length - 1].perimeter,
              3
            );

            setTimeout(() => {
              const exist = this.acumuladosPerimetro.find(
                (ele) =>
                  ele.x === target.x && ele.y === target.y && ele.z === target.z
              );
              if (exist) {
              } else {
                this.formulaManual += this.formulaManual
                  ? '+' + perimeter
                  : perimeter;
                this.calculateFormula();
              }
            });
            const vector: any =
              selecciones[selecciones.length - 1].label.three.position;
            const material = selecciones[selecciones.length - 1].mesh.material;
            const redondeado = this.consulta.redondeo(
              selecciones[selecciones.length - 1].perimeter,
              3
            );

            (
              selecciones[selecciones.length - 1].label.three
                .element as HTMLElement
            ).innerHTML = redondeado;
            (
              selecciones[selecciones.length - 1].label.three
                .element as HTMLElement
            ).innerText = redondeado;
            // (
            //   selecciones[selecciones.length - 1].label.three
            //     .element as HTMLElement
            // ).style.width = '29px';
            // (
            //   selecciones[selecciones.length - 1].label.three
            //     .element as HTMLElement
            // ).style.height = '16px';
            // (
            //   selecciones[selecciones.length - 1].label.three
            //     .element as HTMLElement
            // ).style.fontSize = '9px';
            // (
            //   selecciones[selecciones.length - 1].label.three
            //     .element as HTMLElement
            // ).style.padding = '3px';
            if (material instanceof THREE.MeshBasicMaterial) {
              const antcolor = material.color;
              material.userData['colorAnterior'] = antcolor;
              material.color.set('#FF0000');
            }
            // this.marker.create(this.world, perimeter, vector);
          }
          // this.face.delete()
        }
      } else if (this.capturarVolumen) {
        if (this.highlighter.selection['select']) {
          if (Object.keys(this.highlightVol).length !== 0) {
            const fragmentIdMap: any = this.highlightVol;
            const searchKey = Object.keys(fragmentIdMap)[0];
            const exists = this.acumuladosVolumen.find((obj) =>
              Object.prototype.hasOwnProperty.call(obj, searchKey)
            );
            if (exists) {
              return;
            }
            this.highlighter.clear();
            if (Object.keys(fragmentIdMap).length !== 0) {
              this.acumuladosVolumen.push(fragmentIdMap);
            }
            const addToSet = (uuid: string, value: any) => {
              if (value instanceof Set) {
                value.forEach((val) => addToSet(uuid, val));
              } else {
                if (!this.selectedFragments[uuid]) {
                  this.selectedFragments[uuid] = new Set();
                }
                this.selectedFragments[uuid].add(value);
              }
            };
            Object.entries(fragmentIdMap).forEach(
              ([uuid, value]: [string, any]) => {
                addToSet(uuid, value);
                const row: any = this.arrFragments.find(
                  (ele: any) => ele.uuid === uuid
                );
                const color = Object.values(
                  JSON.parse(JSON.stringify(row.instanceColor.array))
                );
                this.coloresRestaurarVol.push(color);
              }
            );

            const volumen = this.volumen.getVolumeFromFragments(fragmentIdMap);
            const volRedon = this.consulta.redondeo(volumen, 3);
            if (this.volumen.label) {
              (this.volumen.label.three.element as HTMLElement).innerHTML =
                volRedon;
              (this.volumen.label.three.element as HTMLElement).innerText =
                volRedon;
              // (this.volumen.label.three.element as HTMLElement).style.width =
              //   '29px';
              // (this.volumen.label.three.element as HTMLElement).style.height =
              //   '16px';
              // (this.volumen.label.three.element as HTMLElement).style.fontSize =
              //   '9px';
              // (this.volumen.label.three.element as HTMLElement).style.padding =
              //   '3px';
            }

            setTimeout(() => {
              this.formulaManual += this.formulaManual
                ? '+' + volRedon
                : volRedon;
              this.calculateFormula();
              this.highlighter.clear();
            });
          }
          if (Object.keys(this.selectedFragments).length !== 0) {
            // this.highlighter.highlightByID('select', this.selectedFragments, true);
            const color = new THREE.Color(0xff0000);
            this.classifier.setColor(this.selectedFragments, color, true);
          }
        }
      } else if (this.capturarLongitud && !this.tipoManualData) {
        setTimeout(() => {
          const element = this.dimensions.preview?.label.three.element;
          const largo = element?.innerText ? parseFloat(element.innerText) : 0;
          this.formulaManual += this.formulaManual ? '+' + largo : largo;
          this.calculateFormula();
        });
      }
    }
  }

  restaurarColoresVolumen(selectedFragments: any) {
    if (this.selectedFragments !== null && this.coloresRestaurarVol.length) {
      let i = 0;
      for (const key in this.selectedFragments) {
        if (Object.prototype.hasOwnProperty.call(this.selectedFragments, key)) {
          let element: any = {};
          element[key] = this.selectedFragments[key];
          const colorarr = this.coloresRestaurarVol[i];
          const color = new THREE.Color(colorarr[0], colorarr[1], colorarr[2]);
          this.classifier.setColor(element, color, true);
        }
        i++;
      }

      this.selectedFragments = {};
      this.coloresRestaurarVol = [];
    }
  }

  cambioVerClipper(event: any) {
    this.clipper.visible = event.target.checked;
  }

  cambioColClipper(event: any) {
    this.clipper.material.color.set(event.target.value);
  }

  calculateFormula() {
    try {
      let result;
      if (this.formulaManual !== '') {
        result = this.evaluateFormula(this.formulaManual);
        this.result = this.consulta.redondeo(result, 3);
      } else {
        this.result = '';
      }

      this.isFormulaValid = true;
    } catch (error) {
      this.result = '';
      this.isFormulaValid = false;
    }
  }

  evaluateFormula(formula: string): number {
    return eval(formula); // No usar en producción sin sanitización adecuada
  }

  captureImage(): void {
    if (!this.renderer) return;
    this.renderer.render(this.world.scene.three, this.world.camera.three);
    const remToPx =
      parseFloat(getComputedStyle(document.documentElement).fontSize) * 35;

    const imageURL = this.renderer.domElement.toDataURL('image/png');
    const img = new Image();
    img.src = imageURL;
    img.onload = () => {
      // const cropWidth = img.width * 0.6;
      const cropWidth = Math.max(img.width - remToPx, 0);
      const cropHeight = img.height;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        // ctx.drawImage(
        //   img,
        //   img.width * 0.4,
        //   0,
        //   cropWidth,
        //   cropHeight,
        //   0,
        //   0,
        //   cropWidth,
        //   cropHeight
        // );
        ctx.drawImage(
          img,
          remToPx,
          0,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );

        const croppedImageURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = croppedImageURL;
        let nombreArchivo = 'captura_ifc.png';
        if (this.paso == 2 && this.filPres !== null) {
          nombreArchivo =
            this.tablaMetrado[this.filPres].item +
            '-' +
            this.tablaMetrado[this.filPres].descripcion +
            '-captura_ifc.png';
        }
        link.download = nombreArchivo;
        link.click();
      }
    };
  }

  cambioCheckManual() {
    if (this.capturarArea) {
      if (this.tipoManualData) {
        // this.face.enabled = false;
        this.crearSegmentosArea();
      } else {
        // this.area.enabled = false;
        this.face.enabled = true;
        this.area.enabled = false;
        this.highlighter.enabled = false;
      }
    } else if (this.capturarLongitud) {
      if (this.tipoManualData) {
        // this.dimensions.enabled = false;
        this.crearSegmentosLongitud();
      } else {
        this.dimensions.enabled = true;
        this.longitud.enabled = false;
        if (this.container) {
          this.container.ondblclick = async () => {
            const creado = await this.dimensions.create();
          };
        }
      }
    }
  }

  confirm() {
    this.confirmationService.confirm({
      message: 'Are you sure that you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // Accept action
      },
      reject: () => {
        // Reject action
      },
    });
  }

  cambioTitulo() {
    if (this.titSelect) {
      this.tablaMetrado = this.titSelect.elementos;
      this.tablaDetalles = this.titSelect.detalles;
      this.filPres = null;
      this.tablaGenerada = [];
      this.tablaPlantilla = [];
      this.mostrarPrevPlant = false;
      this.visible = false;
      this.visible2 = false;
      this.visible3 = false;
      this.visible4 = false;
    }
  }

  eliminarFilaPrev() {}

  selFilTabGenera(i: number) {
    if (!this.filTabGenerada.includes(i)) {
      this.tablaGenerada.forEach((ele) => (ele.checked = false));
    }
    this.filTabGenerada = [];
    if (this.ultResTabGen) {
      this.classifier.resetColor(this.ultResTabGen);
      this.ultResTabGen = null;
    }

    this.filTabGenerada.push(i);
    const fragmentMap = this.tablaGenerada[i].fragmentId;
    if (fragmentMap && Object.keys(fragmentMap).length !== 0) {
      const color = new THREE.Color(0xe7aa26);
      this.classifier.setColor(fragmentMap, color);
      this.ultResTabGen = fragmentMap;
    }
  }

  blurTablaGenerada(event: any, i: number, key: string) {
    event.preventDefault();
    let row = this.tablaGenerada[i] as { [key: string]: any };
    row['editar' + key] = false;
    if (row[key] == event.target.value || !row['checked']) {
      return;
    }
    // row[key] = event.target.value;
    let modificados = [];
    if (row['checked']) {
      let i = 0;
      for (const element of this.tablaGenerada) {
        if (element.checked) {
          this.tablaGenerada[i][key] = event.target.value;
          modificados.push(this.tablaGenerada[i]);
        }
        i++;
      }
    }
    if (modificados.length) {
      this.actualizarTablaGenerada(modificados, this.filPres);
    }
  }

  async actualizarTablaGenerada(
    modificados: any,
    filPres: any,
    toaster = false
  ) {
    const datos2 = await modificados.map((ele: any) => {
      if (ele.fragmentId instanceof Set) {
        ele.fragmentId = JSON.stringify(Array.from(ele.fragmentId));
      } else if (ele.fragmentId && typeof ele.fragmentId === 'object') {
        const keys = Object.keys(ele.fragmentId);
        keys.forEach((key) => {
          if (ele.fragmentId[key] instanceof Set) {
            ele.fragmentId[key] = Array.from(ele.fragmentId[key]);
          }
        });
        ele.fragmentId = JSON.stringify(ele.fragmentId);
      } else {
        ele.fragmentId = '';
      }
      return ele;
    });

    const indice2 = this.tablaMetrado[filPres].indice;
    const datos1 = JSON.stringify(datos2);
    const id_proyecto = JSON.stringify(this.id_proyecto);
    const indice = JSON.stringify(indice2);
    const obj = JSON.stringify({
      id_proyecto: id_proyecto,
      indice: indice,
      datos1: datos1,
    });
    const response = await lastValueFrom(
      this.consulta.modificarDetalleMetradoIfc(obj)
    );
    if (response.id == '1') {
      const datosArray: any[] = [];

      datos2.forEach((elemento: any) => {
        if (elemento.fragmentId !== '') {
          try {
            const parsedFragmentId = JSON.parse(elemento.fragmentId);
            if (Array.isArray(parsedFragmentId)) {
              elemento.fragmentId = new Set(parsedFragmentId);
            } else if (
              parsedFragmentId &&
              typeof parsedFragmentId === 'object'
            ) {
              for (const key in parsedFragmentId) {
                if (Array.isArray(parsedFragmentId[key])) {
                  parsedFragmentId[key] = new Set(parsedFragmentId[key]);
                }
              }
              elemento.fragmentId = parsedFragmentId;
            }
            datosArray.push(elemento);
          } catch (error) {
            console.error('Error al parsear JSON:', error);
            datosArray.push({ ...elemento, fragmentId: null });
          }
        } else {
          datosArray.push(elemento);
        }
      });
      // this.tablaDetalles[filPres] = datosArray;
      // this.tablaGenerada = datosArray;
    }

    if (response.id == '1') {
      if (toaster) {
        this.messageService.add({
          severity: 'success',
          summary: 'Correcto',
          detail: 'Se guardó correctamente',
        });
      }
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar',
      });
    }
  }

  buscarTablaGene(fragmentIdMap: any) {
    this.filTabGenerada = [];
    if (this.ultResTabGen) {
      this.classifier.resetColor(this.ultResTabGen);
      this.ultResTabGen = null;
    }

    const filtrados = this.tablaGenerada.filter(
      (ele) =>
        ele.fragmentId &&
        JSON.stringify(ele.fragmentId) === JSON.stringify(fragmentIdMap)
    );
    if (filtrados.length) {
      for (const element of filtrados) {
        this.filTabGenerada.push(element.ind);

        const color = new THREE.Color(0xe7aa26);
        this.classifier.setColor(fragmentIdMap, color);
        this.ultResTabGen = fragmentIdMap;
        if (this.verColDetalle || this.verColEjes) {
          this.tablaGenerada[element.ind].checked = true;
        }
      }
    }
  }

  cambioCheckTabGen(event: any, i: number) {
    this.tablaGenerada[i].checked = event.checked;
  }

  cambioCheckColum(event: any, tipo: string) {
    if (this.filPres !== null) {
      if (tipo == 'ejes') {
        this.tablaMetrado[this.filPres].ejeactivo = event.checked ? 1 : 0;
        this.verColEjes = event.checked;
      } else {
        this.tablaMetrado[this.filPres].detaactivo = event.checked ? 1 : 0;
        this.verColDetalle = event.checked;
      }
      // this.guardarVinculos([this.tablaMetrado[this.filPres]], false);
      this.guardarCambios([this.filPres]);
    }
  }
}
