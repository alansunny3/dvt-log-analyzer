// Add this to your index.html inside the Analysis Method section:

// Replace the analysis method section with this enhanced version:
React.createElement('div', { className: "bg-white/10 rounded-xl p-6 border border-white/20" },
    React.createElement('h2', { className: "text-xl font-bold text-white mb-4" }, "Analysis Method"),
    React.createElement('div', { className: "space-y-4" },
        // Local Analysis Option
        React.createElement('div', { 
            className: `p-4 rounded-lg border-2 cursor-pointer transition-all ${!useAI ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 hover:border-blue-400'}` ,
            onClick: () => setUseAI(false)
        },
            React.createElement('div', { className: "flex items-center gap-3 mb-2" },
                React.createElement('input', {
                    type: "radio",
                    checked: !useAI,
                    onChange: () => setUseAI(false)
                }),
                React.createElement('span', { className: "text-white font-medium" }, "Enhanced Local Analysis"),
                React.createElement('span', { className: "bg-green-500 text-white px-2 py-1 rounded text-xs" }, "RECOMMENDED")
            ),
            React.createElement('div', { className: "text-sm text-gray-300 ml-6" },
                React.createElement('div', { className: "mb-2" }, "🏥 Health scoring • 📊 Advanced patterns • ⚡ Instant results"),
                React.createElement('div', { className: "text-green-300" }, "✅ Works with any file size • ✅ Comprehensive analysis • ✅ Always reliable")
            )
        ),
        
        // AI Analysis Option
        React.createElement('div', { 
            className: `p-4 rounded-lg border-2 cursor-pointer transition-all ${useAI ? 'border-purple-500 bg-purple-500/10' : 'border-white/20 hover:border-purple-400'}`,
            onClick: () => setUseAI(true)
        },
            React.createElement('div', { className: "flex items-center gap-3 mb-2" },
                React.createElement('input', {
                    type: "radio", 
                    checked: useAI,
                    onChange: () => setUseAI(true)
                }),
                React.createElement('span', { className: "text-white font-medium" }, "Claude AI Analysis"),
                React.createElement('span', { className: "bg-purple-500 text-white px-2 py-1 rounded text-xs" }, "QUICK INSIGHTS")
            ),
            React.createElement('div', { className: "text-sm text-gray-300 ml-6" },
                React.createElement('div', { className: "mb-2" }, "🤖 AI insights • 🚀 Ultra-fast (when it works) • 📝 Concise"),
                React.createElement('div', { className: "text-yellow-300" }, "⚠️ May timeout with large files • ⚠️ Limited detail • ⚠️ Best for quick checks")
            )
        )
    ),
    
    // File Size Warning
    files.length > 0 && (() => {
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        const totalSizeMB = totalSize / (1024 * 1024);
        
        if (totalSizeMB > 1 && useAI) {
            return React.createElement('div', { className: "mt-4 bg-yellow-900/30 rounded-lg p-4 border border-yellow-500/30" },
                React.createElement('div', { className: "flex items-start gap-3" },
                    React.createElement('div', { className: "text-yellow-400 text-xl" }, "⚠️"),
                    React.createElement('div', {},
                        React.createElement('h4', { className: "text-yellow-200 font-medium mb-1" }, 
                            `Large Files Detected (${totalSizeMB.toFixed(1)}MB)`
                        ),
                        React.createElement('p', { className: "text-yellow-300 text-sm mb-2" },
                            "AI analysis may timeout with files this large. Enhanced Local Analysis is recommended."
                        ),
                        React.createElement('button', {
                            onClick: () => setUseAI(false),
                            className: "bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        }, "Switch to Local Analysis")
                    )
                )
            );
        }
        return null;
    })(),
    
    // Pro Tips
    React.createElement('div', { className: "mt-4 bg-blue-900/30 rounded-lg p-4 border border-blue-500/30" },
        React.createElement('h4', { className: "text-blue-200 font-medium mb-2" }, "💡 Pro Tips:"),
        React.createElement('ul', { className: "text-blue-300 text-sm space-y-1" },
            React.createElement('li', {}, "• Enhanced Local Analysis rivals professional tools"),
            React.createElement('li', {}, "• AI Analysis works best with files under 1MB"),
            React.createElement('li', {}, "• For large files, Local Analysis is faster and more reliable"),
            React.createElement('li', {}, "• Both methods provide actionable recommendations")
        )
    )
)
