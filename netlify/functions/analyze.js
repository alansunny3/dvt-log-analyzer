// Enhanced AI Analysis Function with Obol Documentation
// Replace the analyzeWithClaude function in your index.html with this version:

const analyzeWithClaude = async (filesWithContent) => {
    console.log('Starting AI analysis with Obol documentation integration...');
    
    // Enhanced prompt with Obol context
    const prompt = `You are an expert Obol Network DVT (Distributed Validator Technology) log analyzer. Analyze these log files and provide insights with specific Obol documentation references.

## LOG FILES CONTEXT:
${filesWithContent.map(f => `- **${f.name}** (${f.type}): ${f.content.split('\n').length} lines`).join('\n')}

## ANALYSIS REQUIREMENTS:

### 1. DVT CONSENSUS & CHARON ANALYSIS
- Identify DVT consensus events and Charon middleware issues
- Look for QBFT consensus rounds, leader selection, and distributed validator coordination
- Reference: https://docs.obol.org/docs/learn/intro

### 2. OBOL CLUSTER HEALTH
- Assess overall cluster health and node participation
- Identify split validator key issues or cluster formation problems
- Reference: https://docs.obol.org/docs/int/quickstart/create-cluster

### 3. MEV-BOOST INTEGRATION
- Analyze MEV-Boost relay performance in DVT context
- Identify relay timeouts, failures, and optimization opportunities
- Reference: https://docs.obol.org/docs/advanced/mev-boost

### 4. NETWORKING & P2P ISSUES
- Examine Charon P2P networking and node discovery
- Identify connectivity issues between DVT cluster members
- Reference: https://docs.obol.org/docs/advanced/networking

### 5. PERFORMANCE OPTIMIZATION
- Assess DVT-specific performance metrics and bottlenecks
- Focus on consensus timing, attestation coordination, and block proposal efficiency
- Reference: https://docs.obol.org/docs/advanced/performance-tuning

## OBOL DOCUMENTATION INTEGRATION:
For each issue identified, provide specific Obol documentation links from:
- Main docs: https://docs.obol.org/
- Troubleshooting: https://docs.obol.org/docs/advanced/troubleshooting
- Charon config: https://docs.obol.org/docs/charon/run/docker
- Monitoring: https://docs.obol.org/docs/advanced/monitoring

## OUTPUT FORMAT:
Structure your response as:
1. **DVT Cluster Health Score** (0-100)
2. **Critical Issues** (with Obol doc links)
3. **Consensus Analysis** (QBFT/leader detection)
4. **Charon Middleware Status**
5. **Actionable Recommendations** (with specific Obol documentation references)

Keep analysis concise but actionable. Always include relevant Obol documentation links.

## LOG SAMPLES:
${filesWithContent.map(f => `### ${f.name} (${f.type.toUpperCase()})\n${f.content.slice(0, 3000)}`).join('\n\n')}

Provide your analysis with specific Obol Network context and documentation references.`;

    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Request failed');
    }

    const data = await response.json();
    
    if (data.success) {
        // Enhance AI response with additional Obol documentation
        const enhancedAnalysis = data.analysis + `

## 📚 Additional Obol Resources

### Quick References:
- **🚀 Getting Started**: [Obol Quickstart](https://docs.obol.org/docs/start/quickstart_group)
- **🔧 Troubleshooting**: [Common Issues](https://docs.obol.org/docs/advanced/troubleshooting)
- **📊 Monitoring**: [Health Checks](https://docs.obol.org/docs/advanced/monitoring)
- **🌐 Networking**: [P2P Configuration](https://docs.obol.org/docs/advanced/networking)
- **⚡ Performance**: [Optimization Guide](https://docs.obol.org/docs/advanced/performance-tuning)

### DVT-Specific Resources:
- **🔑 Key Management**: [Distributed Keys](https://docs.obol.org/docs/advanced/key-management)
- **🤝 Consensus**: [QBFT & Leadership](https://docs.obol.org/docs/learn/intro)
- **🔗 Charon**: [Middleware Documentation](https://docs.obol.org/docs/charon/intro)
- **💎 MEV-Boost**: [DVT Integration](https://docs.obol.org/docs/advanced/mev-boost)
- **📦 Backup & Recovery**: [Key Safety](https://docs.obol.org/docs/advanced/backup-recovery)

### Community & Support:
- **📖 Full Documentation**: [docs.obol.org](https://docs.obol.org)
- **💬 Discord Community**: Get help from other DVT operators
- **🐛 Report Issues**: Contribute to Obol Network development

---
*Analysis enhanced with Obol Network documentation integration*`;

        return enhancedAnalysis;
    } else {
        throw new Error(data.error || 'Analysis failed');
    }
};
