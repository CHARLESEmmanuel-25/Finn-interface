import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Indicators = [
  {
    label: "ROI",
    description:
      "mesurer le retour sur investissment, Rendement pour les actionnaires.",
  },
  {
    label: "ROE",
    description:
      "mesurer le retour sur le capital qu'on a utilise pour réaliser les investissement.",
  },
  {
    label: "ROA",
    description: "Efficacité des actifs de 'entreprise à générer du profit.",
  },
  {
    label: "PER",
    description: "Indique combien les investisseurs paint pour 1 € de bénéfice",
  },
  {
    label: "PB",
    description: "Compare le prix au patrimoine net de l'entreprise",
  },
  {
    label: "PEG",
    description:
      "Il permet donc d'évaluer si une action est chère ou bon marché en fonction de son ruthme de croissance",
  },
  {
    label: "Debt/equity",
    description: "mesures la capacité d'endettement de l'entreprise",
  },
  {
    label: "Debt/ebitda",
    description:
      "mesure en combien d'année l'entreprise pet rembourser ses dettes",
  },
  {
    label: "Cash Ratio",
    description:
      "mesure la capacite de la boite a avoir du cash rapidement, important pour eviter la faillite",
  },
  {
    label: "Marge d'exploitation",
    description: "Elle reflète la rentabilité réelle du cœur de métie",
  },
  {
    label: "Marge nette",
    description: "Elle reflète la rentabilité réelle du cœur de métier",
  },
];

export const FrenchStockFilter = () => {
  const [selectedFilter, setSelectedFilter] = useState(Indicators[0].label);

  const handleSelectedFilter = (indicator: string) => {
    setSelectedFilter(indicator);
  };
  return (
    <View style={styles.container}>
      <Text style={{ color: "#FFF" }}>Filtres</Text>
      <View style={styles.filtersWrapper}>
        {Indicators.map((indicator) => (
          <TouchableOpacity
            key={indicator.label}
            style={[
              styles.filter,
              selectedFilter === indicator.label
                ? {
                    backgroundColor: "#8B5CF6",
                  }
                : null,
            ]}
            onPress={() => handleSelectedFilter(indicator.label)}
          >
            <Text style={{ color: "#FFF" }}>{indicator.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    padding: 8,
  },
  filtersWrapper:{
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filter: {
    backgroundColor: "#111",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
});
