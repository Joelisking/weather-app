import { Image, SafeAreaView, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme';
import { MagnifyingGlassIcon, CalendarDaysIcon } from 'react-native-heroicons/outline';
import { MapPinIcon } from 'react-native-heroicons/solid';
import { useCallback, useState, useEffect } from 'react';
import { debounce } from 'lodash';
import { fetchLocations, fetchWeatherForecast } from '../api/weather';
import { weatherImages } from '../constants';
import * as Progress from 'react-native-progress';
import { getData, storeData } from '../utils/asyncStorage';

const Home = () => {
  const [searchBar, toggleSearchBar] = useState(false);
  const [locations, setLocations] = useState([]);
  const [weatherForecast, setWeatherForecast] = useState({});
  const [loading, setLoading] = useState(true);

  const handleSearch = (value) => {
    if (value.length > 2) {
      fetchLocations({ cityName: value }).then((data) => {
        setLocations(data);
      });
    }
  };

  const handleLocation = (loc) => {
    console.log('location: ', loc);
    setLocations([]);
    toggleSearchBar(false);
    setLoading(true);
    fetchWeatherForecast({ cityName: loc.name, days: '3' }).then((data) => {
      setWeatherForecast(data);
      setLoading(false);
      storeData('city', loc.name);
      console.log('got forecast', data);
    });
  };

  useEffect(() => {
    fetchMyWeatherData();
  }, []);

  const fetchMyWeatherData = async () => {
    let myCity = await getData('city');
    let cityName = 'Islamabad';
    if (myCity) cityName = myCity;
    fetchWeatherForecast({ cityName, days: '3' }).then((data) => {
      setWeatherForecast(data);
      setLoading(false);
    });
  };

  const handleTextDebounce = useCallback(debounce(handleSearch, 1200), []);

  const { current, location } = weatherForecast;

  return (
    <View className="flex-1 relative">
      <StatusBar style="light" />
      <Image
        source={require('../assets/bg.jpg')}
        // className="flex-1 w-[100%] h-[100%]"
        className="absolute w-full h-full"
        blurRadius={60}
      />
      {loading ? (
        <View className="flex-1 flex-row justify-center items-center">
          <Progress.CircleSnail direction="clockwise" thickness={10} size={120} color="white" />
        </View>
      ) : (
        <SafeAreaView className="flex-1">
          {/* Search section */}
          <View style={{ height: '7%' }} className="mx-4 z-50 relative">
            <View
              className="flex-row mt-5 justify-end rounded-full"
              style={{
                backgroundColor: searchBar ? theme.bgWhite(0.2) : 'transparent',
              }}>
              {searchBar ? (
                <TextInput
                  onChangeText={handleTextDebounce}
                  placeholder="Search City"
                  placeholderTextColor={'lightgray'}
                  className="pl-6 flex-1 text-white mt-1 mb-1"
                />
              ) : null}

              <TouchableOpacity
                onPress={() => toggleSearchBar(!searchBar)}
                style={{
                  backgroundColor: searchBar ? theme.bgWhite(0.3) : 'transparent',
                }}
                className="rounded-full p-3 m-1">
                <MagnifyingGlassIcon size="25" color="white" />
              </TouchableOpacity>
            </View>
            {locations.length > 0 && searchBar ? (
              <View className="absolute w-full bg-gray-300 top-16 rounded-3xl">
                {locations.map((loc, index) => {
                  let showBorder = index + 1 != locations.length;
                  let borderClass = showBorder ? 'border-b-2 border-b-gray-400' : '';
                  return (
                    <TouchableOpacity
                      onPress={() => handleLocation(loc)}
                      key={index}
                      className={'flex-row items-center border-0 p-3 px-4 mb-1' + borderClass}>
                      <MapPinIcon size="20" color="gray" />
                      <Text className="text-black text-lg ml-2 ">
                        {loc?.name}, {loc?.country}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>
          {/* forecast  */}
          <View className="mx-4 flex justify-center flex-1 -mt-10">
            {/* location */}
            <Text className="text-white text-center text-3xl font-bold mb-5">
              {location?.name}, <Text className="text-xl font-semibold text-gray-300">{location?.country}</Text>
            </Text>
            {/* weather image */}
            <View className="flex-row justify-center">
              <Image className="w-48 h-48" source={weatherImages[current?.condition?.text]} resizeMode="contain" />
            </View>
            {/* degrees */}
            <View className="space-y-2 mb-5 mt-5">
              <Text className="text-center font-bold text-white text-6xl ml-5">{current?.temp_c}&#176;</Text>
              <Text className="text-center text-white text-xl ml-5 tracking-widest">{current?.condition?.text}</Text>
            </View>
            {/* other stats */}
            <View className="flex-row justify-between mx-4 -mb-7">
              <View className="flex-row space-x-2 items-center">
                <Image source={require('../assets/wind.png')} className="h-6 w-6" />
                <Text className="text-white font-semibold text-base">{current?.wind_kph}km/h</Text>
              </View>
              <View className="flex-row space-x-2 items-center">
                <Image source={require('../assets/rain.png')} className="h-6 w-6" />
                <Text className="text-white font-semibold text-base">{current?.humidity}%</Text>
              </View>
              <View className="flex-row space-x-2 items-center">
                <Image source={require('../assets/sun2.png')} className="h-7 w-7" />
                <Text className="text-white font-semibold text-base">
                  {weatherForecast?.forecast?.forecastday[0]?.astro?.sunrise}
                </Text>
              </View>
            </View>
          </View>

          {/* forecast for next days */}
          <View className="mb-5 space-y-3">
            <View className="flex-row items-center mx-5 space-x-2">
              <CalendarDaysIcon color="white" size="22" />
              <Text className="text-white text-base">Daily forecast</Text>
            </View>
            <View
              style={{ paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              {weatherForecast?.forecast?.forecastday?.map((item, index) => {
                let date = new Date(item.date);
                let options = { weekday: 'long' };
                let dayName = date.toLocaleDateString('en-US', options);
                dayName = dayName.split(',')[0];
                if (index > 2) {
                  console.log(item);
                }
                return (
                  <View
                    key={index}
                    className="flex justify-center items-center w-28 rounded-3xl py-3 space-y-1 mx-2"
                    style={{ backgroundColor: theme.bgWhite(0.15) }}>
                    <Image
                      source={weatherImages[item?.day?.condition?.text]}
                      className="h-11 w-11"
                      resizeMode="contain"
                    />
                    <Text className="text-white">{dayName}</Text>
                    <Text className="text-white text-xl font-semibold">{item?.day?.avgtemp_c}&#176;</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
};

export default Home;
