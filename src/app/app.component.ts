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

import * as OBC from '@thatopen/components';
import * as THREE from 'three'; // Importa THREE.js
import * as OBCF from '@thatopen/components-front';

interface Elemento {
  informacion: any;
  active: boolean;
  nivel: any;
  clase: string;
  claseTraducida: string;
  mostrar: boolean;
  ind: number | null
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChildren('fila') filas!: QueryList<ElementRef>;

  selectedFile: File | null = null;
  infoSeleccionado: any = null;
  container: HTMLElement | null = null; // Iniciar como null
  mostrarNavbar = true;
  dataIFC: Elemento[] = [];
  filaSel: any = null;
  arrayCompleto: any[] = [];
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
  dataGeometrica: any = {};
  highlighter!: OBCF.Highlighter;
  noCargarData: boolean = false;

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
        this.seleccionRow(elemento, index, true);
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
      // console.log('this.volumen', this.volumen);
    }

    // Calcula las diferencias y redondea
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
    for (let i = index+ 1; i < this.dataIFC.length; i++) {
      const element = this.dataIFC[i];
      if (element.nivel == seleccionado.nivel) {
        this.dataIFC[i].mostrar = true;
      } else if (element.nivel < seleccionado.nivel) {
         break
      }
    }
    this.cdr.detectChanges();
  }

  async crearTabla(buffer: any, group: any) {
    const content = new TextDecoder().decode(buffer);
    const lines = content.split('\n');
    const indexedLines: any[] = [];
    lines.forEach((line) => {
      const match = line.match(/^#(\d+)/);
      if (match) {
        const index = parseInt(match[1], 10);
        if (indexedLines.length <= index) {
          indexedLines.length = index + 1;
          
        }
        indexedLines[index] = line;
      }
    });
    this.arrayCompleto = [];
    this.dataIFC = [];
    let proyecto: Elemento[] = [];
    this.items = group.items;
    this.arrFragments = group.children;
    const properties = group.getLocalProperties();

    const arrayCompleto: any[] = [];
    const propertiesArray: any = Object.values(properties);
    console.log('propertiesArray', propertiesArray)
    propertiesArray.forEach((ele: any) => (arrayCompleto[ele.expressID] = ele));
    for (let i = 0; i < arrayCompleto.length; i++) {
      const element = arrayCompleto[i];
      if (!element) {
        arrayCompleto[i] = indexedLines[i];
      }
    }
    this.arrayCompleto = arrayCompleto;
    const project: Elemento = {
      active: true,
      clase: 'IfcProject',
      claseTraducida: 'Proyecto',
      informacion: propertiesArray.find(
        (ele: any) => ele.constructor.name == 'IfcProject'
      ),
      mostrar: true,
      nivel: 0,
      ind: null
    };
    proyecto.push(project);
    const site: Elemento = {
      active: true,
      clase: 'IfcSite',
      claseTraducida: 'Sitio',
      informacion: propertiesArray.find(
        (ele: any) => ele.constructor.name == 'IfcSite'
      ),
      mostrar: true,
      nivel: 1,
      ind: null
    };
    proyecto.push(site);
    const building: Elemento = {
      active: true,
      clase: 'IfcBuilding',
      claseTraducida: 'Edificio',
      informacion: propertiesArray.find(
        (ele: any) => ele.constructor.name == 'IfcBuilding'
      ),
      mostrar: true,
      nivel: 2,
      ind: null
    };
    proyecto.push(building);
    const contenedores: any[] = propertiesArray.filter(
      (ele: any) => ele.constructor.name == 'IfcRelContainedInSpatialStructure'
    );
    for (const element of contenedores) {
      let elementos: any = [];
      let informacion: any = null;
      if (element.RelatedElements && element.RelatedElements.length) {
        let elefiltrado: any[] = [];
        element.RelatedElements.map((ele: any) => {
          const filtrados = propertiesArray
            .filter((data: any) => data.expressID === ele.value)
            .map((data: any) => {
              return {
                active: true,
                clase: data.constructor.name,
                informacion: data,
                nivel: 5,
                mostrar: false,
                ind: null
              };
            });
          elefiltrado = elefiltrado.concat(filtrados);
        });
        elefiltrado.sort((a: any, b: any) => {
          if (a.clase < b.clase) {
            return -1;
          }
          if (a.clase > b.clase) {
            return 1;
          }
          return 0;
        });
        const result: any = [];
        let currentConstructorName: any = null;
        elefiltrado.forEach((item: any) => {
          if (item.clase !== currentConstructorName) {
            const ob: Elemento = {
              active: true,
              clase: item.clase,
              informacion: '',
              nivel: 4,
              claseTraducida: '',
              mostrar: false,
              ind: null
            };
            result.push(ob);
            currentConstructorName = item.clase;
          }
          result.push(item);
        });
        elementos = elementos.concat(result);
      }
      if (element.RelatingStructure) {
        informacion = arrayCompleto[element.RelatingStructure.value];
      }
      const obj: Elemento = {
        active: true,
        informacion: informacion,
        clase: informacion.constructor.name,
        nivel: 3,
        claseTraducida: '',
        mostrar: true,
        ind: null
      };
      proyecto.push(obj);
      proyecto = proyecto.concat(elementos);
    }
    const diccionarioTraduccion: { [key: string]: string } = {
      IfcWall: 'Pared',
      IfcBuildingStorey: 'Piso de Edificio',
      IfcDoor: 'Puerta',
      IfcColumn: 'Pilar',
      IfcWindow: 'Ventana',
      IfcRoof: 'Cubierta',
      IfcSlab: 'Forjado',
      IfcBeam: 'Viga',
      IfcSpace: 'Espacio',
      IfcWallStandardCase: 'Muro Estándar',
      IfcBuildingElementProxy: 'Elemento constructivo indeterminado(Proxy)',
      IfcCurtainWall: 'Muro Entramado',
      IfcFlowTerminal: 'Terminal de Flujo',
      IfcFurnishingElement: 'Elemento de Mobiliario',
      IfcGrid: 'Eje',
      IfcStair: 'Escalera',
      IfcMaterialList: 'Lista de Materiales',
      IfcCovering: 'Revestimiento',
    };
    const diccionarioTraduccion2: { [key: string]: string } = {
      IfcWall: 'Pared',
      IfcBuildingStorey: 'Piso de Edificio',
      IfcDoor: 'Puertas',
      IfcColumn: 'Pilares',
      IfcWindow: 'Ventanas',
      IfcRoof: 'Cubiertas',
      IfcSlab: 'Cimientos',
      IfcBeam: 'Vigas',
      IfcSpace: 'Espacios',
      IfcWallStandardCase: 'Muros',
      IfcBuildingElementProxy:
        'Elementos constructivos indeterminados(Proxies)',
      IfcCurtainWall: 'Muros Entramados',
      IfcFlowTerminal: 'Otros',
      IfcFurnishingElement: 'Muebles',
      IfcGrid: 'Rejillas',
      IfcStair: 'Escaleras',
      IfcMaterialList: 'Lista de Materiales',
      IfcCovering: 'Revestimientos',
    };

    proyecto.forEach((elemento, index) => {
      elemento.ind = index
      if (elemento.nivel > 2) {
        const claseOriginal = elemento.clase;
        let claseTraducida;
        if (elemento.nivel !== 4) {
          claseTraducida =
            diccionarioTraduccion[claseOriginal] || elemento.clase;
        } else {
          claseTraducida =
            diccionarioTraduccion2[claseOriginal] || elemento.clase;
        }
        elemento.claseTraducida = claseTraducida;
        
      }
    });
    this.dataIFC = proyecto;
    console.log('this.dataIFC', this.dataIFC)
    this.buscando = false;
  }

  ngAfterViewInit() {
    this.container = document.getElementById('container');
  }

  ngOnInit() {}

  cargarDocumento(event: any) {
    const file = event.target.files[0];
    if (file) {
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
      this.dataIFC = [];
      this.buscando = true;
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
      const model = await fragmentIfcLoader.load(buffer);
      await this.crearTabla(buffer, model);

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
      highlighter.onBeforeUpdate
      const fragments = model.children;

      highlighter.events['select']?.onHighlight.add(async (fragmentIdMap) => {
        if (this.noCargarData) {
          this.noCargarData = false
        } else {
          this.buscar(fragmentIdMap);
        }
        
      });
      highlighter.events['select']?.onClear.add(() => {
        this.volumen.deleteAll();
        this.dimensions.deleteAll();
      });
     
      this.highlighter = highlighter
      
    
      this.components = components;
      this.volumen = components.get(OBCF.VolumeMeasurement);
      this.volumen.world = world;
      this.volumen.enabled = false;
      this.dimensions = components.get(OBCF.EdgeMeasurement);
      this.dimensions.world = world;
      this.dimensions.enabled = false;
    }
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
    if (index == this.filaSel && !anteriores) {
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
    this.infoSeleccionado = row;
    const fragmentMap = await this.busquedaFragmentos(row.informacion.expressID)
    if (Object.keys(fragmentMap).length !== 0) {
     
      this.noCargarData = true
      this.highlighter.highlightByID("select", fragmentMap, true)
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

  async busquedaFragmentos(idExpress:any) {
    const encontrados:any[] = this.items.filter((ele:any) => 
      ele.ids.has(idExpress)
    );
    let fragmentIdMap: any = {}
    if (encontrados.length) {
      for (const element of encontrados) {
        fragmentIdMap[element.id] = element.ids
      }
    }
    // console.log('fragmentIdMap', fragmentIdMap)
    return fragmentIdMap
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
}
