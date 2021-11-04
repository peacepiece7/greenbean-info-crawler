import "./firebase-config.js";
import { getDatabase, ref, push, update, child, remove } from "firebase/database";

class CoffeeUploader {
  // CRUD
  // Create
  createCoffeeData(data) {
    const database = getDatabase();
    const splitedAry = data.toString().split(",");
    const newPostKey = push(child(ref(database), "coffees")).key;

    // generate new Date
    const today = new Date();
    const year = today.toString().split(" ")[3];
    let month = today.getMonth() + 1;
    let day = today.toString().split(" ")[2];
    let currentTime = today.toString().split(" ")[4].split(":").join("");
    if (month / 10 < 1) {
      month = `0${month.toString()}`;
    }
    if (parseInt(day) / 10 < 1) {
      day = `0${day}`;
    }
    const generateDate = `${year}${month}${day}${currentTime}`;

    const coffeeData = {
      id: newPostKey,
      title: splitedAry[0],
      price: splitedAry[1],
      country: splitedAry[2],
      provider: splitedAry[3],
      directUrl: splitedAry[4],
      date: generateDate,
    };
    // try - catch 나중에 정리하기
    // 정수 색인을 사용하면 데이터 삭제시 순서가 엉망이 될 수 있으니까 id를 색인으로 쓰자
    try {
      update(child(ref(database), "coffees/" + newPostKey), coffeeData);
      this.setProviderData(coffeeData);
      this.setCountryData(coffeeData);
      this.setTitleData(coffeeData);
    } catch (error) {
      console.log(error);
    }
  }

  // ! 수정이 필요함 !
  // * Additional Route ( provider, country, title )
  setProviderData(coffeeData) {
    const providerRef = `provider/${coffeeData.provider}/${coffeeData.id}`;
    const database = getDatabase();
    update(ref(database, providerRef), { id: coffeeData.id });
  }
  setCountryData(coffeeData) {
    const countryRef = `country/${coffeeData.country}/${coffeeData.id}`;
    const database = getDatabase();
    update(ref(database, countryRef), { id: coffeeData.id });
  }
  setTitleData(coffeeData) {
    const titleRef = `title/${coffeeData.title}/${coffeeData.id}`;
    const database = getDatabase();
    update(ref(database, titleRef), { id: coffeeData.id });
  }

  // CRUD
  // Delete
  removeCoffeeData(index, data) {
    const database = getDatabase();
    const providerRef = `provider/${data.provider}/${index}`;
    const countryRef = `country/${data.country}/${index}`;
    try {
      // root에서 loop돌면서 해당 ID를 가진 데이터를 모두 지우자
      remove(ref(database, providerRef));
      remove(ref(database, countryRef));
      remove(ref(database, "coffees/" + index));
    } catch (error) {
      alert("데이터를 삭제할 수 없습니다.");
      console.log(error);
    }
  }
  // CRUD
  // Update
  updateCoffeeData(index, data) {
    const database = getDatabase();
    update(child(ref(database), "coffees/" + index), data);
  }
}

export default CoffeeUploader;
