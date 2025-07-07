export async function enableMocking() {
  if (typeof window === 'undefined') {
    // Server-side: use node version of MSW
    const { server } = await import('../mocks/node');
    server.listen();
  } else {
    // Client-side: use browser version of MSW
    const { worker } = await import('../mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
    });
  }
}