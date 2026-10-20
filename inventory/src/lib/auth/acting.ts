/** The administrator can work as staff of one property. The choice is kept in this browser and sent with every request. */
const KEY = 'acting_property';

export const getActing = (): string | null => {
  try {
    return localStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
};

export const setActing = (id: string | null) => {
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {
    /* private window: the choice just won't stick */
  }
};
