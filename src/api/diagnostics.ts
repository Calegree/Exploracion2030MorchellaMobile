/**
 * Script de diagnóstico de conectividad
 * Usar solo para debugging
 */

export async function testConnectivity() {
  // Endpoints base (sin /predict) para probar solo conectividad
  const endpoints = [
    { url: 'http://10.0.2.2:5000', name: 'Emulador Android (10.0.2.2)' },
    { url: 'http://localhost:5000', name: 'Localhost' }, 
    { url: 'http://127.0.0.1:5000', name: 'Loopback (127.0.0.1)' },
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`[TEST] Probando: ${endpoint.name}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Intentar conexión básica
      const response = await fetch(endpoint.url, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Cualquier respuesta (incluso 404) significa que el servidor es accesible
      const accessible = response.status < 600;
      
      results.push({
        endpoint: endpoint.name,
        url: endpoint.url,
        status: accessible ? 'ACCESSIBLE' : 'ERROR',
        statusCode: response.status,
      });
      console.log(`[TEST] ✓ ${endpoint.name} - Accesible (Status: ${response.status})`);
    } catch (error: any) {
      results.push({
        endpoint: endpoint.name,
        url: endpoint.url,
        status: 'UNREACHABLE',
        error: error.message,
      });
      console.log(`[TEST] ✗ ${endpoint.name} - No accesible: ${error.message}`);
    }
  }
  
  return results;
}

// Llamar desde TestScreen con: import { testConnectivity } from '../api/diagnostics';
