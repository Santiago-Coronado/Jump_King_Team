document.addEventListener('DOMContentLoaded', function() {
    console.log('Iniciando script de gráfica integrado');
    
    // Verificar que el DOM esté cargado y esperar a que la tabla de leaderboard esté lista
    const checkInterval = setInterval(function() {
        const leaderboardContent = document.getElementById('leaderboard-content');
        const tableExists = leaderboardContent && leaderboardContent.querySelector('table');
        
        if (tableExists) {
            console.log('Tabla del leaderboard encontrada, iniciando gráfica');
            clearInterval(checkInterval);
            fetchLeaderboardDataAndCreateGraph();
        }
    }, 1000); // Verificar cada segundo
    
    // Después de 10 segundos, intentar crear el gráfico de todos modos
    setTimeout(function() {
        clearInterval(checkInterval);
        console.log('Timeout alcanzado, intentando crear gráfica de todos modos');
        fetchLeaderboardDataAndCreateGraph();
    }, 10000);
});

async function fetchLeaderboardDataAndCreateGraph() {
    try {
        // Obtener datos del leaderboard desde la API
        const response = await fetch('/api/leaderboard/graph');
        
        if (!response.ok) {
            throw new Error(`Error al cargar datos para la gráfica: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.graphData) {
            initializeGraph(data.graphData);
        } else {
            throw new Error(data.message || 'Error desconocido al cargar datos para la gráfica');
        }
    } catch (error) {
        console.error('Error al cargar datos para la gráfica:', error);
    }
}

function initializeGraph(graphData) {
    // Encontrar o crear el canvas
    const graphContainer = document.querySelector('.graph-container');
    if (!graphContainer) {
        console.error('No se encontró el contenedor del gráfico');
        return;
    }
    
    // Limpiar cualquier contenido anterior
    graphContainer.innerHTML = '';
    
    // Crear un nuevo canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'Graph';
    graphContainer.appendChild(canvas);
    
    // Establecer dimensiones explícitas
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = graphContainer.clientWidth;
    canvas.height = graphContainer.clientHeight;
    
    // Datos estáticos para el gráfico
    
    // Generar colores para los puntos
    const colors = graphData.map(() => generateRandomColor(0.7));
    const borderColors = graphData.map(() => generateRandomColor(1.0));
    
    // Crear el gráfico
    try {
        new Chart(canvas, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Puntuación vs Tiempo',
                    data: graphData,
                    backgroundColor: colors,
                    borderColor: borderColors,
                    borderWidth: 1,
                    pointRadius: 8,
                    pointHoverRadius: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Relación Tiempo Récord vs Puntuación',
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        color: '#FFFFFF'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const point = context.raw;
                                return [
                                    `Jugador: ${point.username}`,
                                    `Tiempo: ${point.timeFormatted}`,
                                    `Puntuación: ${point.y}`
                                ];
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Tiempo Récord (menor es mejor)',
                            font: {
                                weight: 'bold',
                                size: 14
                            },
                            color: '#FFFFFF'
                        },
                        ticks: {
                            color: '#FFFFFF',
                            callback: function(value) {
                                const minutes = Math.floor(value / 60);
                                const seconds = value % 60;
                                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Puntuación (mayor es mejor)',
                            font: {
                                weight: 'bold',
                                size: 14
                            },
                            color: '#FFFFFF'
                        },
                        ticks: {
                            color: '#FFFFFF'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
        
        console.log('Gráfico creado exitosamente');
        
        // Añadir un indicador de éxito
        const successIndicator = document.createElement('div');
        successIndicator.style.color = '#4CAF50';
        successIndicator.style.fontWeight = 'bold';
        successIndicator.style.textAlign = 'center';
        successIndicator.style.padding = '5px';
        graphContainer.appendChild(successIndicator);
        
    } catch (error) {
        console.error('Error al crear el gráfico:', error);
        
        // Mostrar mensaje de error en el contenedor
        graphContainer.innerHTML = `
            <div style="color: red; text-align: center; padding: 20px;">
                Error al crear el gráfico: ${error.message}
            </div>
        `;
    }
}

function generateRandomColor(alpha) {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}