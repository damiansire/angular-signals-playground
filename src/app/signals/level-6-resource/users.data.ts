export interface DemoUser {
  name: string;
  role: string;
}

const USERS: Record<number, DemoUser> = {
  1: { name: 'Ada Lovelace', role: 'Pionera de la programación' },
  2: { name: 'Alan Turing', role: 'Padre de la computación' },
  3: { name: 'Grace Hopper', role: 'Inventora del compilador' },
};

/** Simula la búsqueda de un usuario; lanza si el id no existe (para demostrar el estado de error). */
export function lookupUser(id: number): DemoUser {
  const user = USERS[id];
  if (!user) {
    throw new Error(`No existe el usuario #${id}`);
  }
  return user;
}

export const KNOWN_USER_IDS = Object.keys(USERS).map(Number);
