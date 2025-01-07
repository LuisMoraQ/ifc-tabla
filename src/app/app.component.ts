import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ElementRef,
  HostListener,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
// import * as WEBIFC from 'web-ifc';
import * as BUI from '@thatopen/ui';
// import Stats from 'stats.js';
import * as CUI from '@thatopen/ui-obc';
import * as WEBIFC from 'web-ifc';
import * as OBC from '@thatopen/components';
import * as THREE from 'three'; // Importa THREE.js
import * as OBCF from '@thatopen/components-front';
import { ConsultasService } from 'src/services/consultas.service';
import { EventType } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

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
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, AfterViewInit {
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
  paso = 1;
  filPres = null;
  multPres = false;
  grid!: OBC.SimpleGrid;
  verGrid = false;
  area!: OBCF.AreaMeasurement;
  face!: OBCF.FaceMeasurement;
  isCtrlPressed = false;
  multAcumulados: any = {};
  world!: OBC.SimpleWorld<
    OBC.SimpleScene,
    OBC.SimpleCamera,
    OBCF.PostproductionRenderer
  >;
  searchText = '';
  arrGlobalsIds: any = {};
  listaVinculados: any[] = [];
  codigoDocumento = null;
  bloqVincPartid = false
  constructor(
    private cdr: ChangeDetectorRef,
    private consulta: ConsultasService,
    private _snackBar: MatSnackBar
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

    let menorx = Infinity;
    let menory = Infinity;
    let menorz = Infinity;
    let mayorx = -Infinity;
    let mayory = -Infinity;
    let mayorz = -Infinity;

    let arr: any[] = [];
    for (const element of array) {
      const row: any = this.arrFragments.find(
        (ele: any) => ele.uuid === element
      );
      // console.log('fragmentBbox',fragmentBbox)
      if (row) {
        arr.push(row);
        if (row.geometry && row.geometry.boundingBox) {
          row.geometry.computeBoundingBox();
          const boundingBox = row.geometry.boundingBox;
          // console.log('boundingBox', boundingBox)
          menorx = Math.min(menorx, boundingBox.min.x);
          menory = Math.min(menory, boundingBox.min.y);
          menorz = Math.min(menorz, boundingBox.min.z);
          mayorx = Math.max(mayorx, boundingBox.max.x);
          mayory = Math.max(mayory, boundingBox.max.y);
          mayorz = Math.max(mayorz, boundingBox.max.z);
          // console.log('aaa', menorx,menory,  menorz, mayorx, mayory, mayorz)
          const x1 = Number((boundingBox.max.x - boundingBox.min.x).toFixed(2));
          const y1 = Number((boundingBox.max.y - boundingBox.min.y).toFixed(2));
          const z1 = Number((boundingBox.max.z - boundingBox.min.z).toFixed(2));
          // console.log('dd', x1, y1, z1);
        }
      }
    }
    let volumen;
    // if (this.verVolumen) {
    // volumen = await this.volumen.getVolumeFromMeshes(arr);
    volumen = await this.volumen.getVolumeFromFragments(map);
    this.volumen.clear();

    // }

    const x = Number((mayorx - menorx).toFixed(2));
    const y = Number((mayory - menory).toFixed(2));
    const z = Number((mayorz - menorz).toFixed(2));
    // const volumen2 = x * y * z;
    // console.log('volumen2', volumen2)
    const AreaTotal = 2 * (x * y + x * z + y * z);
    const a = x * y;
    const b = x * z;
    const c = y * z;
    const AreaMaxima = Math.max(a, b, c);
    const Thickness = Math.min(x, y, z);
    // console.log(x, y, z);
    this.dataGeometrica = {
      boundingboxlength: x,
      boundingboxwidth: y,
      boundingboxheight: z,
      volumen: volumen,
      AreaTotal: AreaTotal,
      AreaMaxima: AreaMaxima,
      Thickness: Thickness,
    };
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
        id_proyecto: 291,
        titulo: '',
      };
      const metrado = await this.consulta.ListarMetradoIfc(obj2);
      if (metrado) {
        metrado.forEach((element: any, index: number) => {
          element.vinculo = false;
          element.ind = index;
        });
        this.tablaMetrado = metrado;
        console.log('this.tablaMetrad', this.tablaMetrado);
      }
    } catch (error) {
      console.log(error);
    }
  }

  cargarDocumento(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.buscando = true;
      this.selectedFile = file;
      this.processFile(file);
    }
  }

  async processFile(file: File) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = new Uint8Array(e.target?.result as ArrayBuffer);
      await this.processModelFromBuffer(buffer);
    };
    reader.readAsArrayBuffer(file);
  }

  async processModelFromBuffer(buffer: Uint8Array) {
    if (this.container) {
      this.limpiarVariables();
      if (this.container) {
        while (this.container.firstChild) {
          this.container.removeChild(this.container.firstChild);
        }
      }
      const components = new OBC.Components();
      const fragmentIfcLoader = components.get(OBC.IfcLoader);
      fragmentIfcLoader.settings.excludedCategories.add(3856911033);

      const worlds = components.get(OBC.Worlds);
      const world = worlds.create<
        OBC.SimpleScene,
        OBC.SimpleCamera,
        OBCF.PostproductionRenderer
      >();
      world.scene = new OBC.SimpleScene(components);
      world.renderer = new OBCF.PostproductionRenderer(
        components,
        this.container
      );
      world.camera = new OBC.SimpleCamera(components);

      components.init();
      world.camera.controls.setLookAt(
        -1.0198054354798272,
        3.545293038971296,
        31.53745535058005,
        0,
        0,
        -10
      );
      world.renderer.postproduction.enabled = true;
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
      world.renderer.postproduction.customEffects.excludedMeshes.push(
        grid.three
      );

      await fragmentIfcLoader.setup();
      fragmentIfcLoader.settings.wasm = {
        path: 'https://unpkg.com/web-ifc@0.0.66/',
        absolute: true,
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
      highlighter.dispose();
      highlighter.setup({ world: world });
      highlighter.onBeforeUpdate;

      const fragments = model.children;
      this.items = model.items;
      this.arrFragments = model.children;

      this.indexer = indexer;
      this.model = model;

      highlighter.events['select']?.onHighlight.add(async (fragmentIdMap) => {
        // outliner.clear('example');
        // outliner.add('example', fragmentIdMap);
        if (!this.isCtrlPressed) {
          this.buscar(fragmentIdMap);
          this.multAcumulados = fragmentIdMap;
        } else {
          this.acumularMapas(fragmentIdMap);
        }
        // console.log('highloght', fragmentIdMap)
      });
      highlighter.events['select']?.onClear.add(() => {
        this.volumen.deleteAll();
        this.dimensions.deleteAll();
        // console.log('clear');
        this.multAcumulados = {};
      });

      this.highlighter = highlighter;

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

      // this.face.selectionMaterial.transparent = true
      // const outliner = components.get(OBCF.Outliner);
      // outliner.world = world;

      // console.log('outliner', outliner);

      // outliner.create(
      //   'example',
      //   new THREE.MeshBasicMaterial({
      //     color: 0x1dd397,
      //     transparent: false,
      //     opacity: 0.9,
      //   })
      // );
    }
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
    let proyecto: any[] = [];
    this.allTypes = [];
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
          result.push(obj);
          result.push(...groupedData[type]);
        }
      }
      proyecto = proyecto.concat(result);
    }

    const diccionarioType: { [key: number]: string[] } = {
      103090709: ['IfcProject', 'Proyecto', 'Proyecto'],
      4097777520: ['IfcSite', 'Sitio', 'Sitio'],
      4031249490: ['IfcBuilding', 'Edificio', 'Edificio'],
      3124254112: ['IfcBuildingStorey', 'Piso de Edificio', 'Piso de Edificio'],
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
      263784265: ['IfcFurnishingElement', 'Elemento de Mobiliario', 'Muebles'],
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

    proyecto.forEach((ele, index) => {
      ele.ind = index;
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
      if (ele.informacion?.GlobalId?.value) {
        this.arrGlobalsIds[ele.informacion.GlobalId.value] = ele;
      }
    });
    this.buscando2 = false;
    this.dataIFC = proyecto;
    console.log('this.dataIFC', this.dataIFC);
  }

  verBarrasDimensiones() {
    this.verDimensiones = !this.verDimensiones;
    this.dimensions.enabled = this.verDimensiones;
    if (this.dimensions.enabled) {
      if (this.container) {
        this.container.ondblclick = () => this.dimensions.create();
        this.container.onclick = () => this.dimensions.deleteAll();
      }
    } else {
      this.dimensions.deleteAll();
    }
  }

  verVisualVolumenes() {
    this.verVolumen = !this.verVolumen;
    this.volumen.enabled = this.verVolumen;
    if (this.container) {
      this.container.onclick = () => this.volumen.deleteAll();
    }
  }

  async seleccionRow(row: any, index: number, anteriores = false) {
    this.infoSeleccionado = row;
    this.dataGeometrica = {};
    if (index == this.filaSel && !anteriores) {
      this.nivel = '';
      return;
    }

    // this.highlighter.clear();
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
              // Object.entries(fragmentMap).map((uuid: any) => {
              //   console.log('a', uuid[0], uuid[1])
              //   concatenado[uuid[0]] = uuid[1];
              // });
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
      }
    }
    // if (row.informacion && !row.propiedades.length && row.nivel > 4) {
    //   let propiedades: any[] = [];
    //   const psets = await this.indexer.getEntityRelations(
    //     this.model,
    //     row.informacion.expressID,
    //     'IsDefinedBy'
    //   );
    //   if (psets) {
    //     for (const expressID of psets) {
    //       const pset = await this.model.getProperties(expressID);
    //       await OBC.IfcPropertiesUtils.getPsetProps(
    //         this.model,
    //         expressID,
    //         async (propExpressID) => {
    //           const prop = await this.model.getProperties(propExpressID);
    //           propiedades.push(prop);
    //         }
    //       );
    //     }
    //   }
    // }
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
    this.filPres = null
    this.multPres = false
    this.paso = 1
    this.verGrid = false
    this.arrGlobalsIds = []
  }

  sliderIfc(row: any, ind: number, event: any, fuente: number) {
    const almacenar = [];
    // let agregar: any[] = [];
    // let eliminar: any[] = [];

    // if (!this.tipoTabla) {
    //   if (row.nivel > 4) {
    //     console.log('row', row.informacion);
    //     if (event.target.checked) {
    //       agregar.push(row.informacion.GlobalId.value);
    //     } else {
    //       eliminar.push(row.informacion.GlobalId.value);
    //     }
    //   }
    //   for (let i = row.ind + 1; i < this.dataIFC.length; i++) {
    //     let element = this.dataIFC[i];
    //     if (element.nivel > row.nivel) {
    //       if (event.target.checked) {
    //         if (element.nivel > 4) {
    //           agregar.push(element.informacion.GlobalId.value);
    //         }
    //       } else {
    //         if (element.nivel > 4) {
    //           eliminar.push(element.informacion.GlobalId.value);
    //         }
    //       }
    //       element.vinculado = event.target.checked;
    //     } else {
    //       break;
    //     }
    //   }
    // } else {
    // }
    // if (fuente == 1) {
    //   this.dataIFC[row.ind].vinculado = event.target.checked;
    //   const filtrados = this.tablaMetrado.filter(
    //     (ele: Elemento) => ele.vinculado
    //   );
    //   console.log('filtrados', filtrados)
    //   console.log('agregar', agregar)
    //   console.log('eliminar', eliminar)
    //   filtrados.forEach((element: any) => {
    //     if (agregar.length) {
    //       agregar.forEach((type: any) => {
    //         if (!element.vinculos.includes(type)) {
    //           this.tablaMetrado[element.ind].vinculos.push(type);
    //         }
    //       });
    //     }
    //     if (eliminar.length) {
    //       eliminar.forEach((type: any) => {
    //         if (element.vinculos.includes(type)) {
    //           let index = element.vinculos.indexOf(type);
    //           if (index !== -1) {
    //             this.tablaMetrado[element.ind].splice(index, 1);
    //           }
    //         }
    //       });
    //     }
    //   });
    // } else {
    //   this.tablaMetrado[row.ind].vinculado = event.target.checked;
    //   const filtrados = this.dataIFC.filter((ele: Elemento) => ele.vinculado);
    // }
    let agregar = [];
    let eliminar = [];

    if (row.nivel < 5) {
      for (let i = row.ind + 1; i < this.dataIFC.length; i++) {
        let element = this.dataIFC[i];
        if (element.nivel > row.nivel) {
          if (event.target.checked) {
            if (element.nivel > 4) {
              agregar.push(element.informacion.GlobalId.value);
            }
          } else {
            if (element.nivel > 4) {
              eliminar.push(element.informacion.GlobalId.value);
            }
          }
          element.vinculado = event.target.checked;
        } else {
          break;
        }
      }
    } else {
      if (event.target.checked) {
        agregar.push(row.informacion.GlobalId.value);
      } else {
        eliminar.push(row.informacion.GlobalId.value);
      }
    }
    if (this.filPres) {
      let vinculos = this.tablaMetrado[this.filPres].vinculos
        ? this.tablaMetrado[this.filPres].vinculos?.split('|')
        : [];
      if (agregar.length) {
        for (const element of agregar) {
          if (!vinculos.includes(element)) {
            vinculos.push(element);
          }
        }
      }
      if (eliminar.length) {
        for (const element of eliminar) {
          if (vinculos.includes(element)) {
            let indice = vinculos.indexOf(element);
            if (indice !== -1) {
              vinculos.splice(indice, 1);
            }
          }
        }
      }
      this.tablaMetrado[this.filPres].vinculos = vinculos.join('|');
      this.tablaMetrado[this.filPres].nombredoc = vinculos.length
        ? this.selectedFile.name
        : '';
      this.tablaMetrado[this.filPres].clavedoc = vinculos.length
        ? this.codigoDocumento
        : '';
      if (!this.tablaMetrado[this.filPres].plantilla) {
        this.tablaMetrado[this.filPres].plantilla = '';
      }
      almacenar.push(this.tablaMetrado[this.filPres]);
      this.guardarVinculos(almacenar);

      this.resaltarVinculados(vinculos);
    }
  }

  async guardarVinculos(datos: any) {
    const datos1 = JSON.stringify(datos);
    const obj = JSON.stringify({
      id_proyecto: 291,
      id_usuario: 3,
      datos1: datos1,
    });
    const response = await this.consulta.guardarMetradoIfc(obj);
  }

  verVinculados(row: any) {
    this.listaVinculados = [];
    if (row.vinculos) {
      const arr: any = row.vinculos.split('|');
      for (const element of arr) {
        this.listaVinculados.push(this.arrGlobalsIds[element]);
      }
    }
    console.log('this.listaVinculados', this.listaVinculados);
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
      if (this.tablaMetrado[this.filPres].clavedoc !== this.codigoDocumento) {
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
    }
    if (!this.tablaMetrado[this.filPres].unidad) {
      this._snackBar.open('La fila seleccionada no es partida', '', {
        duration: 3000,
        panelClass: ['error-snack-bar'],
      });
      return;
    }
    this.multPres = !this.multPres;
  }

  selFilTabMetr(row: any, i: any) {
    if (i == this.filPres) {
      return;
    }
    if (row.clavedoc == this.codigoDocumento) {
      this.bloqVincPartid = false
    } else {
      this.bloqVincPartid = true
    }
    this.highlighter.clear();

    this.filPres = row.ind;
    this.dataIFC = this.dataIFC.map((elemento) => ({
      ...elemento,
      vinculado: false,
    }));
    if (this.filPres !== null && this.tablaMetrado[this.filPres].vinculos) {
      const arr = this.tablaMetrado[this.filPres].vinculos.split('|');
      for (const element of arr) {
        const filaIfc = this.arrGlobalsIds[element];
        this.dataIFC[filaIfc.ind].vinculado = true;
      }
      this.resaltarVinculados(arr);
    }
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
      this.marcarVinculados(concatenado);
    }
  }

  todoElNivelSel() {
    let eleBuscar: any = null;
    if (this.filaSel !== null) {
      for (let i = this.infoSeleccionado.ind - 1; i >= 0; i--) {
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

  todoTipoSel() {
    if (this.filaSel !== null) {
      const classifier = this.components.get(OBC.Classifier);
      classifier.byEntity(this.model);
      classifier.byIfcRel(
        this.model,
        WEBIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE,
        'storeys'
      );
      classifier.byModel(this.model.uuid, this.model);
      const classBusqueda = this.infoSeleccionado.clase.toUpperCase();
      const fragmentMap = classifier.find({
        entities: [classBusqueda],
      });
      if (Object.keys(fragmentMap).length !== 0) {
        this.noCargarData = true;
        this.highlighter.highlightByID('select', fragmentMap, true);
        // this.filaSel = null
        // this.infoSeleccionado = null
      }
    } else {
      this._snackBar.open('Ningun elemento seleccionado', '', {
        duration: 2000,
        panelClass: ['error-snack-bar'],
      });
      return;
    }
  }

  todoElPiso() {
    if (this.filaSel !== null) {
      let eleBuscar: any = null;
      for (let i = this.filaSel - 1; i >= 0; i--) {
        const element = this.dataIFC[i];
        if (element.nivel == 3) {
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

  async ocultarElNivelSel() {
    let eleBuscar: any = null;
    if (this.filaSel !== null) {
      for (let i = this.infoSeleccionado.ind - 1; i >= 0; i--) {
        const element = this.dataIFC[i];
        if (element.nivel < this.infoSeleccionado.nivel) {
          eleBuscar = element;
          this.dataIFC[i].visible = false;
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
    if (this.filaSel !== null) {
      const classBusqueda = this.infoSeleccionado.clase;
      for (let i = 0; i < this.dataIFC.length; i++) {
        const element: any = this.dataIFC[i];
        if (element.nivel == 4 && element.clase == classBusqueda) {
          this.dataIFC[i].visible = false;
          const fakeEvent = {
            target: {
              checked: false,
            },
          };
          fakeEvent.target.checked = false;
          await this.hiderRow(element, fakeEvent, element.ind);
        }
      }
      this.filaSel = null;
      this.infoSeleccionado = null;
    } else {
      this._snackBar.open('Ningun elemento seleccionado', '', {
        duration: 2000,
        panelClass: ['error-snack-bar'],
      });
      return;
    }
  }

  ocultarNoSelec() {
    if (this.multAcumulados) {
      const hider = this.components.get(OBC.Hider);
      hider.isolate(this.multAcumulados);
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
      this.filaSel = null;
      this.infoSeleccionado = null;
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

  marcarVinculados(multAcumulados: any) {
    const classifier = this.components.get(OBC.Classifier);
    const color = new THREE.Color(0x299717);
    classifier.setColor(multAcumulados, color);
  }


}
