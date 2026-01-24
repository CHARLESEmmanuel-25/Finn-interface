import React, { useState } from "react";
import { Image, View, StyleSheet, Text, ImageStyle, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface LogoImageProps {
  logo?: string | null;
  symbol: string;
  name?: string;
  size?: number;
  style?: ImageStyle | ViewStyle;
  containerStyle?: ViewStyle;
}

export const LogoImage: React.FC<LogoImageProps> = ({
  logo,
  symbol,
  name,
  size = 48,
  style,
  containerStyle,
}) => {
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Générer les initiales depuis le symbol ou le name
  const getInitials = () => {
    if (symbol && symbol.length >= 2) {
      return symbol.substring(0, 2).toUpperCase();
    }
    if (name) {
      const words = name.split(" ");
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  // Si pas de logo ou logo vide, afficher directement le placeholder
  if (!logo || logo.trim() === "") {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "#8B5CF6",
            justifyContent: "center",
            alignItems: "center",
          },
          style,
          containerStyle,
        ]}
      >
        <Text
          style={{
            color: "#FFF",
            fontSize: size * 0.35,
            fontWeight: "bold",
          }}
        >
          {getInitials()}
        </Text>
      </View>
    );
  }

  // Si erreur de chargement, afficher le placeholder
  if (hasError) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "#8B5CF6",
            justifyContent: "center",
            alignItems: "center",
          },
          style,
          containerStyle,
        ]}
      >
        <Text
          style={{
            color: "#FFF",
            fontSize: size * 0.35,
            fontWeight: "bold",
          }}
        >
          {getInitials()}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
          backgroundColor: "#2A2A2A",
        },
        containerStyle,
      ]}
    >
      <Image
        source={{ uri: logo }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style as ImageStyle, // Explicitly cast to ImageStyle to fix type error
        ]}
        onError={() => setHasError(true)}
        onLoad={() => setImageLoaded(true)}
      />
      {!imageLoaded && !hasError && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: "#2A2A2A",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: size / 2,
            },
          ]}
        >
          <Ionicons name="business" size={size * 0.5} color="#8B5CF6" />
        </View>
      )}
    </View>
  );
};
