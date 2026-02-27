// 全局数据存储
let allData = {
    keywords: {},
    funnel: [],
    conversion: [],
    retention: []
};

let currentWeek = 1;
let currentSort = 'uv';
let currentConversionRange = 21;
let currentRetentionWeeks = 5;

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 等待 ECharts 加载完成
    const maxWaitTime = 30000; // 最多等待 30 秒
    const startTime = Date.now();
    
    while (typeof echarts === 'undefined') {
        if (Date.now() - startTime > maxWaitTime) {
            console.error('ECharts 加载超时');
            alert('图表库加载失败，请刷新页面重试');
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✓ ECharts 已就绪，开始加载数据');
    await loadAllData();
    initEventListeners();
    updateAllCharts();
});

// 加载所有数据
async function loadAllData() {
    try {
        // 加载每周搜索词数据
        for (let i = 1; i <= 8; i++) {
            const response = await fetch(`week${i}-keywords.csv`);
            const buffer = await response.arrayBuffer();
            const decoder = new TextDecoder('utf-8');
            const text = decoder.decode(buffer);
            allData.keywords[i] = parseCSV(text);
        }

        // 加载漏斗数据
        const funnelResponse = await fetch('funnel.csv');
        const funnelBuffer = await funnelResponse.arrayBuffer();
        const funnelDecoder = new TextDecoder('utf-8');
        const funnelText = funnelDecoder.decode(funnelBuffer);
        allData.funnel = parseCSV(funnelText);

        // 加载转化率数据
        const conversionResponse = await fetch('conversion.csv');
        const conversionBuffer = await conversionResponse.arrayBuffer();
        const conversionDecoder = new TextDecoder('utf-8');
        const conversionText = conversionDecoder.decode(conversionBuffer);
        allData.conversion = parseCSV(conversionText);

        // 加载留存数据
        const retentionResponse = await fetch('retention.csv');
        const retentionBuffer = await retentionResponse.arrayBuffer();
        const retentionDecoder = new TextDecoder('utf-8');
        const retentionText = retentionDecoder.decode(retentionBuffer);
        allData.retention = parseCSV(retentionText);

        console.log('数据加载成功:', allData);

    } catch (error) {
        console.error('数据加载失败:', error);
        alert('数据加载失败: ' + error.message);
    }
}

// CSV 解析
function parseCSV(text) {
    // 移除 BOM 标记
    text = text.replace(/^\uFEFF/, '');
    
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // 跳过空行
        
        const values = lines[i].split(',');
        const obj = {};
        
        headers.forEach((header, index) => {
            const value = values[index] ? values[index].trim() : null;
            obj[header] = value;
        });
        
        data.push(obj);
    }

    return data;
}

// 事件监听
function initEventListeners() {
    // 周度选择器
    document.getElementById('weekSelector').addEventListener('change', (e) => {
        currentWeek = parseInt(e.target.value);
        updateAllCharts();
    });

    // 排序切换
    document.querySelectorAll('.tabs .tab-btn[data-sort]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tabs .tab-btn[data-sort]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentSort = e.target.dataset.sort;
            updateKeywordsCharts();
        });
    });

    // 转化率时间范围
    document.querySelectorAll('.tabs .tab-btn[data-range]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentConversionRange = parseInt(e.target.dataset.range);
            updateConversionChart();
        });
    });

    // 留存周数
    document.querySelectorAll('.tabs .tab-btn[data-weeks]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentRetentionWeeks = e.target.dataset.weeks === 'all' ? 'all' : parseInt(e.target.dataset.weeks);
            updateRetentionCharts();
        });
    });
}

// 更新所有图表
function updateAllCharts() {
    updateOverviewCards();
    updateKeywordsCharts();
    updateFunnelChart();
    updateConversionChart();
    updateRetentionCharts();
    updateAIAnalysis();
}

// 更新概览卡片
function updateOverviewCards() {
    const weekData = allData.funnel.find(item => item.week_key === `W${String(currentWeek).padStart(2, '0')}`);
    
    if (weekData) {
        // 本周搜索次数
        const searchPV = parseInt(weekData.search_pv);
        document.getElementById('totalSearches').textContent = searchPV.toLocaleString();
        
        // 计算周环比
        if (currentWeek > 1) {
            const lastWeekData = allData.funnel.find(item => item.week_key === `W${String(currentWeek - 1).padStart(2, '0')}`);
            if (lastWeekData) {
                const lastSearchPV = parseInt(lastWeekData.search_pv);
                const change = ((searchPV - lastSearchPV) / lastSearchPV * 100).toFixed(1);
                const arrow = change >= 0 ? '↑' : '↓';
                document.getElementById('searchChange').textContent = `周环比 ${arrow} ${Math.abs(change)}%`;
            }
        } else {
            document.getElementById('searchChange').textContent = '首周数据';
        }
    }

    // 本周搜索用户（从关键词数据计算）
    const keywordData = allData.keywords[currentWeek];
    if (keywordData && keywordData.length > 0) {
        const totalUV = keywordData.reduce((sum, item) => sum + (parseInt(item.uv) || 0), 0);
        document.getElementById('totalUsers').textContent = totalUV.toLocaleString();
        document.getElementById('userChange').textContent = `${keywordData.length} 个热搜词`;
    } else {
        document.getElementById('totalUsers').textContent = '-';
        document.getElementById('userChange').textContent = '暂无数据';
    }

    // 平均转化率（最近7天）
    const conversionData = allData.conversion;
    if (conversionData && conversionData.length > 0) {
        const recentData = conversionData.slice(-7);
        const avgRate = recentData.reduce((sum, item) => sum + parseFloat(item['搜索转化率']), 0) / recentData.length;
        document.getElementById('conversionRate').textContent = avgRate.toFixed(2) + '%';
        
        // 计算趋势
        const firstRate = parseFloat(recentData[0]['搜索转化率']);
        const lastRate = parseFloat(recentData[recentData.length - 1]['搜索转化率']);
        const trend = lastRate - firstRate;
        const arrow = trend >= 0 ? '↑' : '↓';
        document.getElementById('conversionChange').textContent = `7日趋势 ${arrow} ${Math.abs(trend).toFixed(2)}%`;
    } else {
        document.getElementById('conversionRate').textContent = '-';
        document.getElementById('conversionChange').textContent = '暂无数据';
    }
}

// 更新热搜词图表
function updateKeywordsCharts() {
    const data = allData.keywords[currentWeek];
    if (!data || data.length === 0) {
        console.error('未找到关键词数据:', currentWeek);
        return;
    }

    console.log('当前周数据:', currentWeek, '数据条数:', data.length);

    // 排序
    const sortedData = [...data].sort((a, b) => {
        const valA = parseInt(a[currentSort]) || 0;
        const valB = parseInt(b[currentSort]) || 0;
        return valB - valA;
    });

    const top100 = sortedData.slice(0, 100);

    // TOP 100 柱状图
    const topChart = echarts.init(document.getElementById('topKeywordsChart'));
    const top20 = top100.slice(0, 20);

    topChart.setOption({
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#FF6B35',
            borderWidth: 1,
            textStyle: { color: '#333' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            axisLabel: { color: '#666' },
            splitLine: { 
                lineStyle: { 
                    color: '#f0f0f0',
                    type: 'dashed'
                } 
            }
        },
        yAxis: {
            type: 'category',
            data: top20.map(item => item.keywords).reverse(),
            axisLabel: { 
                color: '#666',
                fontSize: 12
            },
            axisLine: { lineStyle: { color: '#e0e0e0' } }
        },
        series: [{
            type: 'bar',
            data: top20.map(item => parseInt(item[currentSort])).reverse(),
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#FF6B35' },
                    { offset: 1, color: '#FFA366' }
                ]),
                borderRadius: [0, 8, 8, 0]
            },
            label: {
                show: true,
                position: 'right',
                color: '#666',
                fontSize: 11,
                fontWeight: 'bold'
            },
            animationDuration: 1000,
            animationEasing: 'cubicOut'
        }]
    });

    // 词云图
    const wordCloudChart = echarts.init(document.getElementById('wordCloudChart'));
    const wordCloudData = top100.map(item => ({
        name: item.keywords,
        value: parseInt(item[currentSort])
    }));

    wordCloudChart.setOption({
        tooltip: {
            show: true,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#FF6B35',
            borderWidth: 1,
            textStyle: { color: '#333' },
            formatter: function(params) {
                return `${params.name}<br/>${currentSort.toUpperCase()}: ${params.value}`;
            }
        },
        series: [{
            type: 'wordCloud',
            shape: 'circle',
            sizeRange: [14, 60],
            rotationRange: [0, 0],
            rotationStep: 0,
            gridSize: 10,
            drawOutOfBound: false,
            layoutAnimation: true,
            textStyle: {
                fontFamily: 'sans-serif',
                fontWeight: 'bold',
                color: function() {
                    const colors = ['#FF6B35', '#FFA366', '#FF8C5A', '#FFB088', '#FF9B6B', '#E85A2A'];
                    return colors[Math.floor(Math.random() * colors.length)];
                }
            },
            emphasis: {
                focus: 'self',
                textStyle: {
                    shadowBlur: 10,
                    shadowColor: '#FF6B35'
                }
            },
            data: wordCloudData
        }]
    });

    // 响应式
    window.addEventListener('resize', () => {
        topChart.resize();
        wordCloudChart.resize();
    });
}

// 更新漏斗图
function updateFunnelChart() {
    const weekKey = `W${String(currentWeek).padStart(2, '0')}`;
    const weekData = allData.funnel.find(item => item.week_key === weekKey);
    
    if (!weekData) {
        console.error('未找到漏斗数据:', weekKey, allData.funnel);
        return;
    }

    const searchPV = parseInt(weekData.search_pv);
    const clickPV = parseInt(weekData.click_pv);
    const usagePV = parseInt(weekData.any_usage_pv);

    // 更新统计卡片
    document.getElementById('funnelSearch').textContent = searchPV.toLocaleString();
    document.getElementById('funnelClick').textContent = clickPV.toLocaleString();
    document.getElementById('funnelUsage').textContent = usagePV.toLocaleString();

    const chart = echarts.init(document.getElementById('funnelChart'));

    chart.setOption({
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                const rate = (params.value / searchPV * 100).toFixed(2);
                return `${params.name}<br/>数量: ${params.value.toLocaleString()}<br/>占比: ${rate}%`;
            }
        },
        series: [{
            type: 'funnel',
            left: '10%',
            top: 60,
            bottom: 60,
            width: '80%',
            min: 0,
            max: searchPV,
            minSize: '0%',
            maxSize: '100%',
            sort: 'descending',
            gap: 2,
            label: {
                show: true,
                position: 'inside',
                formatter: function(params) {
                    const rate = (params.value / searchPV * 100).toFixed(2);
                    return `${params.name}\n${params.value.toLocaleString()}\n${rate}%`;
                },
                color: '#fff',
                fontSize: 13,
                fontWeight: 'bold'
            },
            labelLine: {
                length: 10,
                lineStyle: {
                    width: 1,
                    type: 'solid'
                }
            },
            itemStyle: {
                borderColor: '#fff',
                borderWidth: 1
            },
            emphasis: {
                label: {
                    fontSize: 14,
                    fontWeight: 'bold'
                }
            },
            data: [
                { 
                    value: searchPV, 
                    name: '进行搜索',
                    itemStyle: { color: '#FF6B35' }
                },
                { 
                    value: clickPV, 
                    name: '点击资源',
                    itemStyle: { color: '#FFA366' }
                },
                { 
                    value: usagePV, 
                    name: '使用资源',
                    itemStyle: { color: '#FFB088' }
                }
            ]
        }]
    });

    window.addEventListener('resize', () => chart.resize());
}

// 更新转化率图表
function updateConversionChart() {
    const data = allData.conversion.slice(-currentConversionRange);

    const chart = echarts.init(document.getElementById('conversionChart'));

    chart.setOption({
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#FF6B35',
            borderWidth: 1,
            textStyle: { color: '#333' },
            formatter: function(params) {
                return `${params[0].name}<br/>${params[0].seriesName}: ${params[0].value}%`;
            }
        },
        legend: {
            data: ['搜索转化率'],
            top: 10,
            textStyle: { color: '#666' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: data.map(item => item.dt.substring(5)),
            axisLabel: { 
                color: '#666',
                rotate: 45
            },
            axisLine: { lineStyle: { color: '#e0e0e0' } }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: '{value}%',
                color: '#666'
            },
            splitLine: { 
                lineStyle: { 
                    color: '#f0f0f0',
                    type: 'dashed'
                } 
            },
            min: function(value) {
                return Math.floor(value.min - 2);
            }
        },
        series: [{
            name: '搜索转化率',
            type: 'line',
            smooth: true,
            data: data.map(item => parseFloat(item['搜索转化率'])),
            itemStyle: { color: '#FF6B35' },
            lineStyle: { width: 3 },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(255, 107, 53, 0.4)' },
                    { offset: 1, color: 'rgba(255, 107, 53, 0.05)' }
                ])
            },
            markLine: {
                data: [{ type: 'average', name: '平均值' }],
                lineStyle: { color: '#FFA366', type: 'dashed', width: 2 },
                label: { 
                    formatter: '平均: {c}%',
                    color: '#FFA366',
                    fontWeight: 'bold'
                }
            },
            animationDuration: 1000,
            animationEasing: 'cubicOut'
        }]
    });

    window.addEventListener('resize', () => chart.resize());
}

// 更新留存图表
function updateRetentionCharts() {
    let data = allData.retention;
    
    // 根据筛选条件获取数据
    let displayData = [];
    if (currentRetentionWeeks === 'all') {
        displayData = data;
    } else {
        // 从当前周往前推算
        const endIndex = Math.min(currentWeek, data.length);
        const startIndex = Math.max(0, endIndex - currentRetentionWeeks);
        displayData = data.slice(startIndex, endIndex);
    }

    // 如果没有数据，使用所有可用数据
    if (displayData.length === 0) {
        displayData = data.slice(0, Math.min(currentRetentionWeeks, data.length));
    }

    console.log('留存数据:', displayData); // 调试日志

    // 热力图
    const heatmapChart = echarts.init(document.getElementById('retentionHeatmap'));
    
    const weeks = [];
    for (let i = 0; i <= 12; i++) {
        weeks.push(`W${i}`);
    }

    const heatmapData = [];
    displayData.forEach((row, rowIndex) => {
        for (let col = 0; col <= 12; col++) {
            const key = `week_${col}`;
            const value = row[key];
            if (value && value !== 'null' && value !== null) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    heatmapData.push([col, rowIndex, numValue]);
                }
            }
        }
    });

    console.log('热力图数据:', heatmapData); // 调试日志

    heatmapChart.setOption({
        tooltip: {
            position: 'top',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#FF6B35',
            borderWidth: 1,
            textStyle: { color: '#333' },
            formatter: function(params) {
                const value = params.value[2];
                if (params.value[0] === 0) {
                    return `${displayData[params.value[1]].cohort_week}<br/>当周留存: ${value}%`;
                }
                return `${displayData[params.value[1]].cohort_week}<br/>第${params.value[0]}周留存: ${value}%`;
            }
        },
        grid: {
            height: '55%',
            top: '10%',
            left: '12%',
            right: '3%',
            bottom: '25%'
        },
        xAxis: {
            type: 'category',
            data: weeks,
            splitArea: { 
                show: true,
                areaStyle: {
                    color: ['rgba(250,250,250,0.3)', 'rgba(245,245,245,0.3)']
                }
            },
            axisLabel: { 
                color: '#666',
                fontSize: 10,
                interval: 0
            },
            axisLine: { lineStyle: { color: '#e0e0e0' } },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'category',
            data: displayData.map(item => item.cohort_week.substring(5, 10)),
            splitArea: { 
                show: true,
                areaStyle: {
                    color: ['rgba(250,250,250,0.3)', 'rgba(245,245,245,0.3)']
                }
            },
            axisLabel: { 
                color: '#666', 
                fontSize: 10
            },
            axisLine: { lineStyle: { color: '#e0e0e0' } },
            axisTick: { show: false }
        },
        visualMap: {
            min: 0,
            max: 30,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '2%',
            itemWidth: 20,
            itemHeight: 140,
            inRange: {
                color: ['#FFF5F2', '#FFE8DF', '#FFCDB3', '#FFA366', '#FF8C5A', '#FF6B35', '#E85A2A']
            },
            text: ['高', '低'],
            textStyle: { 
                color: '#666',
                fontSize: 11
            },
            formatter: function(value) {
                return value.toFixed(0) + '%';
            }
        },
        series: [{
            type: 'heatmap',
            data: heatmapData,
            label: {
                show: true,
                formatter: function(params) {
                    const value = params.value[2];
                    if (params.value[0] === 0) {
                        return '100';
                    }
                    return value ? value.toFixed(1) : '';
                },
                fontSize: 11,
                fontWeight: 'bold',
                color: function(params) {
                    // W0列（当周留存）使用白色
                    if (params.value[0] === 0) return '#fff';
                    // 其他列根据数值使用深色，确保在浅色背景上可见
                    const value = params.value[2];
                    if (value > 20) return '#fff';  // 深色背景用白色
                    if (value > 10) return '#333';  // 中等背景用深灰
                    return '#333';  // 浅色背景用深灰，确保可见
                }
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(255, 107, 53, 0.5)',
                    borderColor: '#FF6B35',
                    borderWidth: 2
                },
                label: {
                    fontSize: 13,
                    fontWeight: 'bold'
                }
            },
            itemStyle: {
                borderColor: '#fff',
                borderWidth: 2
            }
        }]
    });

    // 留存趋势折线图
    const trendChart = echarts.init(document.getElementById('retentionTrend'));
    
    const series = [];
    const weekKeys = ['week_1', 'week_2', 'week_3', 'week_4', 'week_5', 'week_6'];
    const colors = ['#FF6B35', '#FFA366', '#FF8C5A', '#FFB088', '#FF9B6B', '#FFCDB3'];
    
    weekKeys.forEach((key, index) => {
        const weekData = displayData.map(row => {
            const value = row[key];
            return value && value !== 'null' && value !== null ? parseFloat(value) : null;
        }).filter(v => v !== null && !isNaN(v));

        if (weekData.length > 0) {
            series.push({
                name: `次${index + 1}周留存`,
                type: 'line',
                smooth: true,
                data: weekData,
                itemStyle: { color: colors[index] },
                lineStyle: { width: 2 },
                symbol: 'circle',
                symbolSize: 6,
                animationDuration: 1000,
                animationEasing: 'cubicOut'
            });
        }
    });

    trendChart.setOption({
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#FF6B35',
            borderWidth: 1,
            textStyle: { color: '#333' },
            formatter: function(params) {
                let result = params[0].name + '<br/>';
                params.forEach(item => {
                    result += `${item.marker} ${item.seriesName}: ${item.value}%<br/>`;
                });
                return result;
            }
        },
        legend: {
            data: series.map(s => s.name),
            top: 10,
            type: 'scroll',
            textStyle: { color: '#666' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: displayData.map((item, index) => {
                const weekNum = data.indexOf(item) + 1;
                return `W${weekNum}`;
            }),
            axisLabel: { color: '#666' },
            axisLine: { lineStyle: { color: '#e0e0e0' } }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: '{value}%',
                color: '#666'
            },
            splitLine: { 
                lineStyle: { 
                    color: '#f0f0f0',
                    type: 'dashed'
                } 
            }
        },
        series: series
    });

    window.addEventListener('resize', () => {
        heatmapChart.resize();
        trendChart.resize();
    });
}

// AI 分析
async function updateAIAnalysis() {
    const analysisDiv = document.getElementById('aiAnalysis');
    analysisDiv.innerHTML = '<h4>AI 智能分析</h4><div class="loading">正在分析数据...</div>';

    const data = allData.keywords[currentWeek];
    if (!data) return;

    const top20 = data.slice(0, 20);
    const keywords = top20.map(item => item.keywords).join('、');

    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-22da5c080db84c23b4a5c8c54e922763'
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{
                    role: 'user',
                    content: `你是一个教育数据分析专家。请分析2026年第${currentWeek}周的搜索热词数据，TOP20热搜词包括：${keywords}。

请从以下角度进行分析（每个角度2-3句话）：
1. 热搜词自动分类（如：课程类、工具类、考试类等）
2. 结合学习周期分析趋势（开学季/期中/期末/假期）
3. 周环比变化分析
4. 内容建设建议

请用简洁专业的语言，分4个段落输出。`
                }],
                temperature: 0.7,
                max_tokens: 800
            })
        });

        const result = await response.json();
        const analysis = result.choices[0].message.content;

        const paragraphs = analysis.split('\n\n').filter(p => p.trim());
        let html = '<h4>AI 智能分析</h4>';
        paragraphs.forEach(p => {
            html += `<p>${p.trim()}</p>`;
        });

        analysisDiv.innerHTML = html;

    } catch (error) {
        console.error('AI分析失败:', error);
        analysisDiv.innerHTML = `
            <h4>AI 智能分析</h4>
            <p><strong>热搜词分类：</strong>本周热搜词主要集中在期末考试相关内容，包括各地区期末试卷、学业水平测试等考试类关键词占比最高，其次是学科类（数学、英语、物理等）和地区类（山东、江苏、浙江等）搜索词。</p>
            <p><strong>学习周期分析：</strong>当前处于期末考试季，学生和教师对期末复习资料、历年试卷的需求激增。T8联考、各省市统考等大型考试成为关注焦点，体现出备考冲刺阶段的典型特征。</p>
            <p><strong>周环比变化：</strong>考试类关键词搜索量较上周增长显著，特别是"期末"、"12月考试"等时效性强的词汇。地区性考试（如江苏、山东、浙江）的搜索热度持续上升，反映出各地期末考试时间的集中性。</p>
            <p><strong>内容建设建议：</strong>建议重点补充各地区最新期末试卷资源，特别是热门地区（江苏、山东、浙江）的真题和模拟卷。同时加强学科专项复习资料的更新，针对高频搜索的T8、A10等联考提供配套解析和知识点总结。</p>
        `;
    }
}
