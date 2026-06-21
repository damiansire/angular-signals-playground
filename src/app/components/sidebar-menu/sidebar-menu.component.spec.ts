import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { SidebarMenuComponent } from './sidebar-menu.component';
import { provideRouter } from '@angular/router';

describe('SidebarMenuComponent', () => {
  let component: SidebarMenuComponent;
  let fixture: ComponentFixture<SidebarMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarMenuComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renderiza un app-menu-option por cada menuItem y el atajo LAB', () => {
    const options = fixture.nativeElement.querySelectorAll('app-menu-option');
    expect(options.length).toBe(component.menuItems.length);
    expect(options.length).toBeGreaterThan(0);

    const lab = fixture.nativeElement.querySelector('a[title="Signals Lab — el banco"]');
    expect(lab).toBeTruthy();
    expect((lab as HTMLElement).textContent?.trim()).toBe('LAB');
  });

  it('getMenuOptionStatus arranca en pending para todos los niveles', () => {
    const firstLevel = component.menuItems[0].id;
    expect(component.getMenuOptionStatus(firstLevel, undefined)).toBe('pending');
  });

  it('setCurrentLevel marca el nivel y subnivel como current y habilita solo su submenu', () => {
    const level = component.menuItems.find((m) => m.subLevels.length > 0)!;
    const otherLevel = component.menuItems.find(
      (m) => m.id !== level.id && m.subLevels.length > 0
    )!;
    const subLevelId = level.subLevels[0].id;

    component.levelHandler.setCurrentLevel(level.id, subLevelId);

    expect(component.getMenuOptionStatus(level.id, undefined)).toBe('current');
    expect(component.getMenuOptionStatus(level.id, subLevelId)).toBe('current');
    expect(component.showSubMenu(level.id)).toBeTrue();
    expect(component.showSubMenu(otherLevel.id)).toBeFalse();
  });

  it('renderiza los subniveles del nivel actual por defecto (level 1)', () => {
    // El handler arranca con currentLevel = level "1"; ese nivel muestra sus subniveles.
    const currentLevel = component.menuItems.find((m) => m.id === '1')!;
    const subOptions = fixture.nativeElement.querySelectorAll('app-menu-sub-level-option');
    expect(subOptions.length).toBe(currentLevel.subLevels.length);
    expect(component.showSubMenu('1')).toBeTrue();
  });
});
