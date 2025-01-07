import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterData',
})
export class FilterDataPipe implements PipeTransform {
  transform(data: any[], searchText: string): any[] {
    if (!data || !searchText) {
      return data;
    }
    const filtered = data.filter(
      (item) =>
        item.informacion?.Name?.value
          .toLowerCase()
          .includes(searchText.toLowerCase()) && item.nivel == 5
    );
    const nivelSuperior = (item: any) => {
      const superiors: any = [];
      let nivel = item.nivel - 1;
      for (let i = item.ind; i >= 0; i--) {
        const element = data[i];
        if (nivel == element.nivel) {
          superiors.push(element);
          nivel--;
        }
      }
      return superiors;
    };
    let arrayFiltrado: any[] = [];
    for (const element of filtered) {
      const superiores = nivelSuperior(element);      
      for (const superior of superiores) {
        if (!arrayFiltrado.some((item) => item === superior)) {
          arrayFiltrado.push(superior)
        }
      }
      if (!arrayFiltrado.some((item) => item === element)) {
        arrayFiltrado.push(element);
      }
    }
    arrayFiltrado.sort((a, b) => a.ind - b.ind);

    return arrayFiltrado;
  }
}
