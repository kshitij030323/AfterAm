import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

/**
 * Shared purple gradient background for the entire app
 * Features:
 * - Deep dark purple/black base (#0a0a12)
 * - Purple glow in top-left corner
 * - Purple glow in bottom-right corner
 */
export function AppBackground() {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Base dark background */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0a0a12' }]} />

            {/* Gradient mesh with purple glows */}
            <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
                <Defs>
                    {/* Top-left purple glow */}
                    <RadialGradient id="topLeftGlow" cx="0%" cy="0%" rx="65%" ry="45%">
                        <Stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5" />
                        <Stop offset="35%" stopColor="#581c87" stopOpacity="0.3" />
                        <Stop offset="70%" stopColor="#3b0764" stopOpacity="0.1" />
                        <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </RadialGradient>

                    {/* Bottom-right purple glow */}
                    <RadialGradient id="bottomRightGlow" cx="100%" cy="100%" rx="65%" ry="45%">
                        <Stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
                        <Stop offset="35%" stopColor="#7c3aed" stopOpacity="0.25" />
                        <Stop offset="70%" stopColor="#581c87" stopOpacity="0.1" />
                        <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </RadialGradient>
                </Defs>

                {/* Apply gradients */}
                <Rect x="0" y="0" width={width} height={height} fill="url(#topLeftGlow)" />
                <Rect x="0" y="0" width={width} height={height} fill="url(#bottomRightGlow)" />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({});
