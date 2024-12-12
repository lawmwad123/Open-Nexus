import { Dimensions } from "react-native";

const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');


const heightPercentage = (percentage) => (deviceHeight * percentage) / 100;
const widthPercentage = (percentage) => (deviceWidth * percentage) / 100;

export { heightPercentage, widthPercentage };
