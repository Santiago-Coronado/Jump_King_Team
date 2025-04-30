document.addEventListener('DOMContentLoaded', function() {
    console.log('Iniciando script de gráficas integrado');
    
    // Verificar que el DOM esté cargado y esperar a que los contenedores estén listos
    const checkInterval = setInterval(function() {
        const leaderboardContent = document.getElementById('leaderboard-content');
        const tableExists = leaderboardContent && leaderboardContent.querySelector('table');
        const dailyLoginsContainer = document.querySelector('.daily-logins-container');
        const powerupsContainer = document.querySelector('.powerups-chart-container');
        
        if (tableExists) {
            console.log('Tabla del leaderboard encontrada, iniciando gráfica');
            fetchLeaderboardDataAndCreateGraph();
        }
        
        if (dailyLoginsContainer) {
            console.log('Contenedor de logins diarios encontrado, iniciando gráfica');
            fetchDailyLoginsDataAndCreateGraph();
        }

        if (powerupsContainer) {
            console.log('Contenedor de estadísticas de power-ups encontrado, iniciando gráfica');
            fetchPowerupStatsAndCreateGraph();
        }
        
        if ((tableExists && dailyLoginsContainer) || 
            (document.querySelector('.graph-container') && dailyLoginsContainer)) {
            clearInterval(checkInterval);
        }
    }, 1000); // Verificar cada segundo
    
    // Después de 10 segundos, intentar crear los gráficos de todos modos
    setTimeout(function() {
        clearInterval(checkInterval);
        console.log('Timeout alcanzado, intentando crear gráficas de todos modos');
        
        if (document.querySelector('.graph-container')) {
            fetchLeaderboardDataAndCreateGraph();
        }
        
        if (document.querySelector('.daily-logins-container')) {
            fetchDailyLoginsDataAndCreateGraph();
        }
    }, 10000);
});

// GRÁFICA DE LEADERBOARD
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
        displayGraphError('.graph-container', error.message);
    }
}
// Grafica de Powerups
async function fetchPowerupStatsAndCreateGraph() {
    try {
        // Obtener datos de power-ups desde la API
        const response = await fetch('/api/powerups/stats');
        
        if (!response.ok) {
            throw new Error(`Error al cargar datos de power-ups: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.powerupStats) {
            initializePowerupGraph(data.powerupStats);
        } else {
            throw new Error(data.message || 'Error desconocido al cargar datos de power-ups');
        }
    } catch (error) {
        console.error('Error al cargar datos de power-ups:', error);
        displayGraphError('.powerups-chart-container', error.message);
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
    canvas.id = 'LeaderboardGraph';
    graphContainer.appendChild(canvas);
    
    // Establecer dimensiones explícitas
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = graphContainer.clientWidth;
    canvas.height = graphContainer.clientHeight;
    
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
        
        console.log('Gráfico de leaderboard creado exitosamente');
    } catch (error) {
        console.error('Error al crear el gráfico de leaderboard:', error);
        displayGraphError('.graph-container', error.message);
    }
}

function initializePowerupGraph(powerupStats) {
    // Encontrar el contenedor
    const graphContainer = document.querySelector('.powerups-chart-container');
    if (!graphContainer) {
        console.error('No se encontró el contenedor para la gráfica de power-ups');
        return;
    }
    
    // Limpiar cualquier contenido anterior
    graphContainer.innerHTML = '';
    
    // Crear un nuevo canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'PowerupsGraph';
    graphContainer.appendChild(canvas);
    
    // Establecer dimensiones 
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = graphContainer.clientWidth;
    canvas.height = graphContainer.clientHeight;
    
    // Colores para cada power-up
    const backgroundColors = [
        'rgba(255, 99, 132, 0.8)',   // Rojo para Double Jump
        'rgba(54, 162, 235, 0.8)',   // Azul para Charged Jump
        'rgba(255, 206, 86, 0.8)'    // Amarillo para Dash
    ];
    
    const borderColors = [
        'rgb(255, 255, 255)',
        'rgb(255, 255, 255)',
        'rgb(255, 255, 255)'
    ];
    
    try {
        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: powerupStats.labels,
                datasets: [{
                    label: 'Porcentaje de jugadores',
                    data: powerupStats.percentages,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Porcentaje de Jugadores con Power-ups',
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        color: '#FFFFFF',
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: '#FFFFFF',
                            padding: 15,
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const count = powerupStats.counts[context.dataIndex] || 0;
                                const total = powerupStats.totalPlayers;
                                return `${label}: ${value}% (${count}/${total} jugadores)`;
                            }
                        }
                    }
                },
                cutout: '50%'
            }
        });
        
        // Si no hay jugadores, mostrar mensaje
        if (powerupStats.totalPlayers === 0) {
            const noDataMsg = document.createElement('div');
            noDataMsg.className = 'no-data-message';
            noDataMsg.textContent = 'No hay datos de jugadores disponibles';
            noDataMsg.style.position = 'absolute';
            noDataMsg.style.top = '50%';
            noDataMsg.style.left = '50%';
            noDataMsg.style.transform = 'translate(-50%, -50%)';
            noDataMsg.style.color = '#FFFFFF';
            noDataMsg.style.fontSize = '16px';
            graphContainer.style.position = 'relative';
            graphContainer.appendChild(noDataMsg);
        }
        
        console.log('Gráfico de power-ups creado exitosamente');
    } catch (error) {
        console.error('Error al crear el gráfico de power-ups:', error);
        displayGraphError('.powerups-chart-container', error.message);
    }
}

// Mostrar error en el contenedor de la gráfica si no hay una
if (typeof displayGraphError !== 'function') {
    function displayGraphError(container, errorMessage) {
        const errorContainer = document.querySelector(container);
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="graph-error" style="text-align: center; padding: 20px; color: #FF6B6B;">
                    <p>Error al cargar la gráfica</p>
                    <small>${errorMessage}</small>
                </div>
            `;
        }
    }
}

// GRÁFICA DE LOGINS DIARIOS
async function fetchDailyLoginsDataAndCreateGraph() {
    try {
        // Obtener datos de logins diarios desde la API
        const response = await fetch('/api/auth/daily-logins');
        
        if (!response.ok) {
            throw new Error(`Error al cargar datos para la gráfica de logins diarios: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.dailyLogins) {
            initializeDailyLoginsGraph(data.dailyLogins);
        } else {
            throw new Error(data.message || 'Error desconocido al cargar datos para la gráfica de logins diarios');
        }
    } catch (error) {
        console.error('Error al cargar datos para la gráfica de logins diarios:', error);
        displayGraphError('.daily-logins-container', error.message);
    }
}

function initializeDailyLoginsGraph(dailyLoginsData) {
    // Encontrar el contenedor
    const graphContainer = document.querySelector('.daily-logins-container');
    if (!graphContainer) {
        console.error('No se encontró el contenedor para la gráfica de usuarios por día');
        return;
    }
    
    // Limpiar cualquier contenido anterior
    graphContainer.innerHTML = '';
    
    // Crear un nuevo canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'DailyLoginsGraph';
    graphContainer.appendChild(canvas);
    
    // Establecer dimensiones explícitas
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = graphContainer.clientWidth;
    canvas.height = graphContainer.clientHeight;
    
    // Asegurarse de que haya datos
    if (!dailyLoginsData || dailyLoginsData.length === 0) {
        displayGraphError('.daily-logins-container', 'No hay datos de usuarios disponibles');
        return;
    }
    
    // Verificar y limitar a últimos 7 días si hay más
    if (dailyLoginsData.length > 7) {
        console.warn('Se recibieron más de 7 días de datos. Limitando a últimos 7.');
        dailyLoginsData = dailyLoginsData.slice(-7);
    }
    
    const validatedData = dailyLoginsData.map(item => ({
        fecha: item.fecha,
        usuarios_conectados: typeof item.usuarios_conectados === 'number' && !isNaN(item.usuarios_conectados) 
            ? item.usuarios_conectados 
            : parseInt(item.usuarios_conectados) || 0
    }));
    
    console.log('Datos validados de usuarios únicos por día:', validatedData);
    
    // Preparar datos para Chart.js
    const dates = validatedData.map(item => formatDate(item.fecha));
    const userCounts = validatedData.map(item => item.usuarios_conectados);
    
    console.log('Fechas formateadas:', dates);
    console.log('Conteos de usuarios:', userCounts);
    
    // Calcular valores para escala Y automática
    const maxUsers = Math.max(...userCounts);
    // Asegurar que la escala Y tenga al menos 4 pasos, incluso si todos son 0
    const yMax = maxUsers > 0 ? Math.ceil(maxUsers * 1.2) : 4;
    
    console.log('Valor máximo de usuarios:', maxUsers);
    console.log('Escala Y máxima:', yMax);
    
    try {
        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Usuarios únicos',
                    data: userCounts,
                    backgroundColor: 'rgba(255, 193, 7, 0.6)',
                    borderColor: 'rgba(255, 193, 7, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Usuarios únicos por día',
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        color: '#FFFFFF',
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    },
                    legend: {
                        display: true,
                        labels: {
                            color: '#FFFFFF',
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 14
                        },
                        padding: 12,
                        cornerRadius: 6,
                        callbacks: {
                            title: function(context) {
                                return `Fecha: ${context[0].label}`;
                            },
                            label: function(context) {
                                const value = context.raw;
                                return `${value} ${value === 1 ? 'usuario único' : 'usuarios únicos'}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Fecha (DD/MM)',
                            font: {
                                weight: 'bold',
                                size: 14
                            },
                            color: '#FFFFFF',
                            padding: {
                                top: 10
                            }
                        },
                        ticks: {
                            color: '#FFFFFF',
                            font: {
                                size: 12
                            },
                            padding: 8,
                            maxRotation: 0, // No rotar las etiquetas
                            autoSkip: false // No saltar automáticamente
                        },
                        grid: {
                            display: false,
                            drawBorder: true,
                            color: 'rgba(255, 255, 255, 0.1)',
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Número de usuarios únicos',
                            font: {
                                weight: 'bold',
                                size: 14
                            },
                            color: '#FFFFFF',
                            padding: {
                                bottom: 10
                            }
                        },
                        min: 0,
                        max: yMax,
                        ticks: {
                            color: '#FFFFFF',
                            font: {
                                size: 12
                            },
                            stepSize: 1,
                            precision: 0,
                            padding: 8
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                        }
                    }
                },
                layout: {
                    padding: {
                        left: 15,
                        right: 15,
                        top: 15,
                        bottom: 15
                    }
                }
            }
        });
        
        console.log('Gráfico de usuarios únicos por día creado exitosamente');
    } catch (error) {
        console.error('Error al crear el gráfico de usuarios únicos por día:', error);
        displayGraphError('.daily-logins-container', error.message);
    }
}


function formatDate(dateString) {
    try {
        const [year, month, day] = dateString.split('-');
        
        const formattedDay = day.toString().padStart(2, '0');
        const formattedMonth = month.toString().padStart(2, '0');
        
        return `${formattedDay}/${formattedMonth}`;
    } catch (error) {
        console.error("Error al formatear fecha:", error);
        return "Error de fecha";
    }
}

function generateRandomColor(alpha) {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}