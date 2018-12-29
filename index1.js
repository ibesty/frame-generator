const Koa = require('koa');
const nunjucks = require('nunjucks');
const app = new Koa();
const serve = require('koa-static');
const fs = require('fs');
const path = require('path');
const md5 = require('md5');
const _ = require('lodash');
const getPixels = require("get-pixels");
app.use(serve('.'));

let filelist = [];

const obj = {
  a: {
    dir: './楼盘广告截图/',
    subDir: '众盟',
    title: '楼盘广告截图'
  },
  b: {
    dir: './楼盘广告截图20181229 2/',
    subDir: '搜索', 
    title: '楼盘广告截图'
  }
}

const current = obj['b']

fileDisplay(current.dir)

let total = 0;
app.use(async ctx => {
  // console.log(ctx.query.p)
  nunjucks.configure({
    autoescape: true
  });

  const p = parseInt(ctx.query.p || 0)
  const num = parseInt((filelist.length / 8))

  const pageSize = num / 2 === 1 ? num - 1 : num

  const currentLocation = (p) => ((p - 1) * pageSize)
  console.log(pageSize, num)

  let tempFileList = p === 8 ? filelist.slice(currentLocation(p)) : filelist.slice(currentLocation(p), currentLocation(p + 1))

  if (p > 8) {
    tempFileList = []
  }
  console.log(tempFileList)

  // tempFileList = tempFileList.sort((a, b) => {
  //   if (a.orientation === 'horizontal') {
  //     return 1
  //   }
  //   return -1
  // })
  
  let redered = nunjucks.render('./index.njk', {
    filelist: tempFileList,
    title: current.title,
    total: total
  });
  ctx.body = redered;
});

app.listen(3000);

function fileDisplay(filePath){
  //根据文件路径读取文件，返回文件列表
  fs.readdir(filePath, function(err,files){
      if(err){
          console.warn(err)
      }else{
          //遍历读取到的文件列表
          files.forEach(function(filename){
              //获取当前文件的绝对路径
              const filedir = path.join(filePath,filename);
              //根据文件路径获取文件信息，返回一个fs.Stats对象
              fs.stat(filedir,function(eror,stats){
                  if(eror){
                      console.warn('获取文件stats失败');
                  }else{
                      const isFile = stats.isFile();//是文件
                      const isDir = stats.isDirectory();//是文件夹
                      if(isFile && filedir.indexOf('DS_Store') < 0 && filedir.indexOf(current.subDir) >= 0){
                          // console.log(filedir)
                          getPixels(filedir, function (err, pixles) {
                            // console.warn(err, filedir)
                            const shape = pixles.shape;
                            filelist.push({
                              uri: filedir,
                              orientation: shape[0] !== 1080 && shape[0] !== 750 ? 'horizontal' : 'vertical'
                            });

                            filelist = filelist.sort((a, b) => {
                              if (a.orientation === 'horizontal') {
                                return 1
                              }
                              return -1
                            })
                          })
                          total ++;
                      }
                      if(isDir){
                          fileDisplay(filedir);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
                      }
                  }
              })
          });
      }
  });
}