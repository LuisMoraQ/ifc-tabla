import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
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

interface Elemento {
  informacion: any;
  active: boolean;
  nivel: any;
  clase: number;
  claseTraducida: string;
  mostrar: boolean;
  ind: number | null;
  visible: boolean;
  propiedades : any
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

  constructor(private cdr: ChangeDetectorRef) {}

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
    if (this.verVolumen) {
      volumen = await this.volumen.getVolumeFromMeshes(arr);
    }

    const x = Number((mayorx - menorx).toFixed(2));
    const y = Number((mayory - menory).toFixed(2));
    const z = Number((mayorz - menorz).toFixed(2));
    // const volumen = x * y * z;
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

    for (let i = index - 1; i >= 0; i--) {
      const element = this.dataIFC[i];

      if (nivelBusq == element.nivel) {
        this.dataIFC[i].mostrar = true;
      } else if (nivelBusq - 1 == element.nivel) {
        this.dataIFC[i].mostrar = true;
        nivelBusq = element.nivel;
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

  ngOnInit() {}

  cargarDocumento(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.buscando2 = true;
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
      world.scene.setup();
      const grids = components.get(OBC.Grids);
      const grid = grids.create(world);
      await fragmentIfcLoader.setup();
      fragmentIfcLoader.settings.wasm = {
        path: 'https://unpkg.com/web-ifc@0.0.66/',
        absolute: true,
      };
      const model: any = await fragmentIfcLoader.load(buffer);
      this.buscando2 = false;
      this.buscando = true;
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

      // this.crearTabla(buffer, model);
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
        this.buscar(fragmentIdMap);
      });
      highlighter.events['select']?.onClear.add(() => {
        this.volumen.deleteAll();
        this.dimensions.deleteAll();
      });

      this.highlighter = highlighter;

      this.components = components;
      this.volumen = components.get(OBCF.VolumeMeasurement);
      this.volumen.world = world;
      this.volumen.enabled = false;
      this.dimensions = components.get(OBCF.EdgeMeasurement);
      this.dimensions.world = world;
      this.dimensions.enabled = false;
      highlighter.zoomToSelection = true;


    
      // const classifier = components.get(OBC.Classifier);

      // await classifier.bySpatialStructure(model, {
      //   isolate: new Set([WEBIFC.IFCBUILDINGSTOREY]),
      // });

      // const indexer = components.get(OBC.IfcRelationsIndexer);
      // console.log('model', model)
      // if (model.hasProperties) {
      //   const arraycompleto = model.getLocalProperties();
      //   await indexer.process(model);
      //   const lista = await indexer.getEntityChildren(model, 1);
      //   if (arraycompleto !== undefined && lista) {
      //     console.log('arraycompleto', arraycompleto)
      //     console.log('lista', lista)
      //     let filteredEntities:any[] = []
      //     lista.forEach(ele => filteredEntities.push(arraycompleto[ele]))
      //     console.log('filteredEntities', filteredEntities)

      //   }
      //   console.log('indexer', indexer);
      // }
      // const classifier = components.get(OBC.Classifier);
      // classifier.byEntity(model);
      // classifier.byModel(model.uuid, model);
      // classifier.byPredefinedType(model);
      // console.log('classifier', classifier);
    }
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
        const dataPiso: Elemento = {
          active: false,
          clase: ele.type,
          claseTraducida: '',
          ind: null,
          informacion: ele,
          mostrar: true,
          nivel: index,
          visible: true,
          propiedades : []
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
        propiedades : []
      };
      proyecto.push(dataPiso);
      let piso: any[] = [];
      const encontrados = indexer.getEntityChildren(model, element.expressID);
      encontrados.forEach((ele: any) => {
        piso.push(arrayCompleto[ele]);
      });
      let groupedData: any = {};
      let result: any[] = [];
      if (piso.length) {
        this.allTypes = this.allTypes.concat(piso.slice(1));
        piso.forEach((item, index) => {
          if (index > 0) {
            if (!groupedData[item.type]) {
              groupedData[item.type] = [];
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
              propiedades : []
            };
            groupedData[item.type].push(obj);
          }
        });
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
            propiedades: []
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
        console.warn('no existe', ele);

        ele.claseTraducida = ele.clase;
        ele.clase = ele.clase;
      }
    });
    this.buscando = false;
    this.dataIFC = proyecto;
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

  async seleccionRow(row: Elemento, index: number, anteriores = false) {
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
    
    if (row.informacion) {
     
      const fragmentMap = await this.busquedaFragmentos(
        row.informacion.expressID
      );
      if (Object.keys(fragmentMap).length !== 0) {
        this.noCargarData = true;

        this.highlighter.highlightByID('select', fragmentMap, true);
      }
    }
    // console.log('row', row.informacion);
    if (row.informacion && !row.propiedades.length && row.nivel > 4) {
      let propiedades: any[] = [];
      const psets = await this.indexer.getEntityRelations(
        this.model,
        row.informacion.expressID,
        'IsDefinedBy'
      );
      // console.log('psets', psets)
      if (psets) {
        // for (const element of psets) {
        //  const a = this.arrayCompleto[element]
         
        //  console.log('a', a)
         
        
        // //  propiedades.push(a)
        // }
        for (const expressID of psets) {
          // You can get the pset attributes like this
          const pset = await this.model.getProperties(expressID);
          // console.log(pset);
          // You can get the pset props like this or iterate over pset.HasProperties yourself
          await OBC.IfcPropertiesUtils.getPsetProps(
            this.model,
            expressID,
            async (propExpressID) => {
              const prop = await this.model.getProperties(propExpressID);
              propiedades.push(prop)
            },
          );
        }
        console.log('propiedades', propiedades)
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
        fragmentIdMap[element.id] = element.ids;
      }
    }
    // console.log('fragmentIdMap', fragmentIdMap)
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

  trackByFn(index: number, item: any): any {
    return item.id; // O cualquier propiedad única que tenga cada fila
  }

  async hiderRow(row: any, event: any, index: number) {
    const hider = this.components.get(OBC.Hider);
    let fragmentMap: any;
    if (row.nivel > 4) {
      this.dataIFC[row.ind].visible = event.target.checked;
      fragmentMap = await this.busquedaFragmentos(row.informacion.expressID);
    } else {
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
              Object.entries(fragmentMap).forEach((uuid: any) => {
                concatenado[uuid[0]] = uuid[1];
              });
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
      this.buscando = true;
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
        4252922144: ['IfcStairFlight','Tramo de escalera', 'Tramos de escaleras'],
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
            propiedades : []
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
              propiedades:[]
            };
            tabla.push(obj2);
            i++;
          }
        }
      }
      this.tablaGrupos = tabla;
      this.buscando = false;
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
    } else {
      this.dataIFC.map((ele, ind) => {
        if (!ele.visible && ele.nivel > 4) {
          filtrados.push(ele);
        }
        this.dataIFC[ind].visible = true;
      });
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
  }
}
