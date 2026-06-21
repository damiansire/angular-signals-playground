import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { NodeTreeComponent } from './node-tree.component';
import { Link, NodeTree } from '../components-draw.inferface';

describe('NodeTreeComponent', () => {
  let component: NodeTreeComponent;
  let fixture: ComponentFixture<NodeTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeTreeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('chartOption arranca con una serie de tipo graph sin datos', () => {
    const series = (component.chartOption().series as unknown[])[0] as {
      type: string;
      data: unknown[];
      links: unknown[];
    };
    expect(series.type).toBe('graph');
    expect(series.data).toEqual([]);
    expect(series.links).toEqual([]);
  });

  it('chartOption refleja nodes y links provistos por input', () => {
    const nodes: NodeTree[] = [
      { id: 'a', name: 'A', x: 0, y: 0, level: 0 },
      { id: 'b', name: 'B', x: 1, y: 1, level: 1, color: '#fff' },
    ];
    const links: Link[] = [{ source: 'a', target: 'b' }];

    fixture.componentRef.setInput('nodes', signal(nodes));
    fixture.componentRef.setInput('links', signal(links));
    fixture.detectChanges();

    const series = (component.chartOption().series as unknown[])[0] as {
      data: NodeTree[];
      links: Link[];
    };
    expect(series.data.length).toBe(2);
    expect(series.data[1].name).toBe('B');
    expect(series.links).toEqual(links);
  });

  it('renderiza el contenedor del grafico echarts', () => {
    const chart = fixture.nativeElement.querySelector('.demo-chart');
    expect(chart).toBeTruthy();
  });
});
