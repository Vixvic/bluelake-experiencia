

## Problema

Hay una condicion de carrera (race condition) en la pagina `/auth`. Cuando el usuario inicia sesion:

1. `onAuthStateChange` establece `user` de inmediato
2. Pero `isAdmin` sigue siendo `false` porque la consulta del rol se ejecuta de forma asincrona (con `setTimeout`)
3. AuthPage evalua `user && !isAdmin` y redirige a la pagina principal `/`
4. Despues se completa la consulta del rol y `isAdmin` cambia a `true`, pero el usuario ya fue redirigido

## Solucion

Modificar **solo** `src/pages/AuthPage.tsx` para que espere a que el estado de autenticacion este completamente cargado (incluyendo el rol) antes de tomar decisiones de redireccion.

### Cambio especifico

En `AuthPage.tsx`, agregar `loading` del contexto de autenticacion y mostrar un spinner mientras `loading` sea `true`, evitando que las redirecciones se ejecuten prematuramente:

```text
Antes (lineas 10, 19-20):
  const { user, isAdmin } = useAuth();
  ...
  if (user && isAdmin) return <Navigate to="/admin" replace />;
  if (user && !isAdmin) return <Navigate to="/" replace />;

Despues:
  const { user, isAdmin, loading: authLoading } = useAuth();
  ...
  if (authLoading) return (spinner de carga);
  if (user && isAdmin) return <Navigate to="/admin" replace />;
  if (user && !isAdmin) return <Navigate to="/" replace />;
```

Esto asegura que la pagina no redirija hasta que el rol del usuario se haya verificado completamente.

### Archivos afectados

- `src/pages/AuthPage.tsx` -- unico archivo modificado

### Seccion tecnica

El problema raiz es que `onAuthStateChange` usa `setTimeout(() => fetchRole(...), 0)` para evitar deadlocks con la API de autenticacion. Esto causa que `user` se establezca en un ciclo de render y `isAdmin` en el siguiente. Sin la verificacion de `loading`/`authLoading`, AuthPage toma la decision de redireccion en ese estado intermedio donde `user` existe pero `isAdmin` aun es `false`.

