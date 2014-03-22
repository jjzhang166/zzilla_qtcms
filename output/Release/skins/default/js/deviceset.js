var oSearchOcx;
	$(function(){

		oSearchOcx = document.getElementById('devSearch');
		var oTreeWarp = $('div.dev_list').slice(2);
		$('ul.filetree').treeview().find('span.channel').click(function(){
			$(this).toggleClass('channel_1')
		});
		oTreeWarp.hide();
		$('#iframe').hide();
		document.oncontextmenu = function(e){  //文档默认右键事件冒泡取消
			var e = e || window.event;
			if(e.target.tagName != 'BODY'){
				return false;
			}
		}
		
		$('div.menu .close').click(function(){  //弹出操作框下部分元素添加关闭窗口事件
			closeMenu();
		})

		$('#device input:radio').each(function(index){ //添加设备弹出框下添加设备方式切换
			$(this).click(function(){
				$('#device input:radio').attr('id','');
				$(this).attr('id','connect_method_ID');
				var oSwitch = $('#device tr').slice(2,6);
				oSwitch.removeClass('tr1').find('input').prop('disabled',false);
				if(index == 0){
					oSwitch.slice(3,4).addClass('tr1').find('input').prop('disabled',true);
				}else{
					oSwitch.slice(0,3).addClass('tr1').find('input').prop('disabled',true);
				}
			})
		})
		
		$('ul.filetree span.areaName').click(function(){
			$('ul.filetree span.areaName').css('background','0');
			$(this).css('background','#ccc');
		})

		$('div.dev_list:lt(2)').each(function(index){
			var This = $(this);
			This.mouseup(function(event){ 
				event.stopPropagation();	
				var obj = $(event.target);
				/*if(obj[0].nodeName == 'SPAN'){
					alert(obj.attr('id'));
				}*/
				if(event.which == 1){
					if( obj[0].nodeName == 'SPAN'){
						if(obj.hasClass('channel')){
							This.find('span').not('span.channel').removeClass('sel');
							if(!$('div.dev_list:eq(1) span.sel.group')[0]){
								$('div.dev_list:eq(1) span.group:eq(0)').addClass('sel');
							}
						}else{ 
							This.find('span').removeClass('sel');
						}
						obj.toggleClass('sel');
					}
					//SetChannelIntoGroupData();
				}
				if(event.which == 3){ 
					if(obj[0].nodeName == 'SPAN'){ 
						$('div.dev_list span').removeClass('sel');
						obj.addClass('sel');
					}else{ 
						if(!$(this).find('span.sel')[0]){
							$(this).find('span:eq(0)').addClass('sel');
						}
					}
					//分组设置下的右键菜单调整
					$('#menu0 li').show()
					$('#menu0 li').eq(index).hide();
					if(index == 1){
						$('#menu0 li:eq(2)').hide();
					}
					showContextMenu(event.clientY,event.clientX,obj);
				}else{ 
					$('#menu0').hide();
				}
			})
		})	
			
		$('.hover').each(function(){  // 按钮元素添加鼠标事件对应样式
			var action = $(this).attr('class').split(' ')[0];
			addMouseStyle($(this),action);
		})
		
		$('#set_content div.left li').each(function(index){
			$(this).click(function(){
				var warp = $('#set_content div.right div.right_content').hide().eq(index).show();
				oTreeWarp.show();
				set_contentMax();
				if(index == 0){
					$('div.dev_list span.device').parent('li').remove();
					searchFlush();
					//区域列表;
					areaList2Ui('0');
				}else if(index == 1){
					$('ul.filetree:eq(2)').find('li').remove();
					areaList2Ui('2');
					$('div.dev_list span.channel').parent('li').remove();
						
						$('ul.filetree:eq(2) span.device').each(function(device_index){
							$(this).click(function(){
								var oDevData = $(this).data('data');
								var _url = 'http://'+oDevData.address+':'+oDevData.port;
								var _usr = oDevData.username;
								var _pwd = oDevData.password;
								var _chn = oDevData.channel_count;				
								$('ul.ipc_list0').hide().nextUntil('div.dev_list').hide();
								$('ul.dvr_list0').hide().nextUntil('div.dev_list').hide();
								if(oDevData.vendor == 'JUAN IPC'){//如果选中设备为ipc
									$('ul.ipc_list0 li').removeClass('ope_listAct');
									$('ul.ipc_list0 li').eq(0).addClass('ope_listAct');
									$('.ipc_list0').show();	
									$('.ipc_list').eq(0).show();
									ipc(_url,_usr,_pwd);
									devinfo_load_content(true);										
								}
							    if(oDevData.vendor == 'JUAN DVR')//如果选中设备为dvr
								{
									$('ul.dvr_list0 li').removeClass('ope_listAct');
									$('ul.dvr_list0 li').eq(0).addClass('ope_listAct');
									$('.dvr_list0').show()
									$('.dvr_list').eq(0).show();
									dvr(_url,_usr,_pwd,_chn);
									dvr_devinfo_load_content();	
								}	
							})
					    })
				}else if(index == 2){
					window['Fill'+warp.find('div.switch:visible').attr('id')+'Data']();
				}else if(index == 3){ 
					userList2Ui();
				}
			})

			// 设置相关
			$('ul.dvr_list0').each(function(){//dvr
				var warp = $(this);
				warp.click(function(){ 
					warp.show();
					$('ul.ipc_list0').hide();
				})
				warp.find('li').each(function(index){
					$(this).click(function(){
						switch(index)
						{
							case 0: dvr_devinfo_load_content();break;
							case 1: dvr_common_load_content();break;
							case 2: dvr_network_load_content();break;
							case 3: dvr_load('dvr_enc_chn_sel');break;
							case 4: dvr_load('dvr_record_chn_sel');break;
							case 5: dvr_load('dvr_screen_chn_sel');break;
							case 6: dvr_load('dvr_detect_chn_sel');break;
							case 7: dvr_load('dvr_ptz_chn_sel');break;
							case 8: dvr_load('dvr_alarm_chn_sel');break;
							default:break;
						}		
					})
				})
			});

			$('ul.ipc_list0').each(function(){//ipc
				var warp = $(this);
				warp.click(function(){ 
					warp.show();
					$('ul.dvr_list0').hide();
				})
				warp.find('li').each(function(index){
					$(this).click(function(){
						switch(index)
						{
							case 0: devinfo_load_content(true);break;
							case 1: encode_load_content();break;
							case 2: network_load_content();break;
							case 3: user_management_load_content();break;
							case 4: time_load_content();break;
							//case 5: alert(5);break;
							default:break;
						}			
					})
				})
			});
		})

		//搜索结果 设备列表tr委托部分事件;
		$('tbody.synCheckboxClick').on('click','tr',function(){
			var data = $(this).data('data');
			if(data.SearchVendor_ID == 'JUAN IPC'){
				for(i in data){
					$('#'+i).val(data[i]);
				}
			}
			$('tbody.synCheckboxClick').find('tr').removeClass('sel')
			$(this).addClass('sel');
		})
		
		//用户table下 tr委托部分事件
		$('table.UserMan').on('click','tr',function(){  //添加用户 tr选中状态添加  数据整合到 hidden的input
			//整理选中的用户ID数组
			var oSelected =[];
			var userName = $(this).find('td').eq(1).html();
			$(this).toggleClass('selected');  // tr toggle样式
			$('table.UserMan tr.selected').each(function(){ 
				oSelected.push($(this).data('data')['username'])
			})
			$('#username_list_ID').val(oSelected.join(','));
		})
		
		set_contentMax();
		
		$('ul.filetree:eq(2)').each(function(){ 
			var warp = $(this)
			$(this).on('click','span.device',function(){ 
				warp.find('span.device').removeClass('sel');
				$(this).addClass('sel');
			})
		})

		/*$('#group_0 span.channel').click(function(){
			var groupOutChlID =[];
			$('#group_0 span.channel.sel').each(function(){
				groupOutChlID.push($(this).data('data').r_chl_group_id);
			})
			$('#r_chl_group_id_ID').val('').val(groupOutChlID.join(','));
			//show($('#r_chl_group_id_ID').val());
		})*/
		/*
		控件触发事件调用的元素事件绑定.
		控件触发事件在JS事件绑定触发的事件后面... 有待考证.
		暂时只用了 RemoveChannelFromGroup_ok AddChannelInGroupDouble_ok 这2个ID做实验
		*/

		$('#RemoveChannelFromGroup_ok').click(function(){
			var groupOutChlID =[];
			$('#group_0 span.channel.sel').each(function(){
				groupOutChlID.push($(this).data('data').r_chl_group_id);
			})
			$('#r_chl_group_id_ID').val('').val(groupOutChlID.join(','));
		})

		$('#AddChannelInGroupDouble_ok').click(function(){ 
			SetChannelIntoGroupData();
		});
		 /*client_setting*/

		//record setting  回放设置;
		$('div.dev_list:eq(3)').on('click','span.channel',function(){
			SettingRecordDoubleTimeParmSuccess();
			$('ul.week.option li').removeData();
			$('div.dev_list:eq(3) span.channel').removeClass('sel')	
			$(this).addClass('sel');
			var chlData = $(this).data('data');
			var sTimeID = oCommonLibrary.GetRecordTimeBydevId(chlData.channel_id);
			for(var i in sTimeID){
				var sTimeIDdata = oCommonLibrary.GetRecordTimeInfo(sTimeID[i]);
				$('#week').attr('chl',chlData.channel_id);
				for(var j in weeks){
					if(j == sTimeIDdata.weekday){
						$('ul.week.option li:eq('+j+')').data('data_'+sTimeID[i],sTimeIDdata);
					}
				}
			}
			initChannlrecTime($('ul.week.option li:eq(0)'));
			$('#week').html('星期一');
		})
		$('ul.week.option li').each(function(index){
			$(this).on('click',function(){
				initChannlrecTime($(this));
			})
		})

		$('#Language_ID').nextAll('li').click(function(){
		 	$('#Language_ID').val($(this).attr('value'));
		})

		$('#SplitScreenMode_ID').nextAll('li').click(function(){
		 	$('#SplitScreenMode_ID').val($(this).attr('value'));
		})

		$('#RecordTime div.timeInput').on('blur','input:text',initRecrodxml);
		$('#RecordTime').on('click','input:checkbox',initRecrodxml);
		/*控件触发事件调用的元素事件绑定.*/
		

		//设备操作相关的事件绑定
		var oActiveEvents = ['AddUser','ModifyUser','DeleteUser','AddArea','ModifyArea','RemoveArea','AddGroup','RemoveGroup','ModifyGroup','ModifyChannel','AddDevice','ModifyDevice','RemoveDevice','AddDeviceDouble','AddChannelDoubleInGroup','SettingStorageParm','SettingCommonParm','SettingRecordDoubleTimeParm','RemoveChannelFromGroup','ModifyGroupChannelName','AddDeviceAll','RemoveDeviceAll'];  //事件名称集合
		for (i in oActiveEvents){
			AddActivityEvent(oActiveEvents[i]+'Success',oActiveEvents[i]+'Success(data)');
			AddActivityEvent(oActiveEvents[i]+'Fail','Fail(data)');
		}

		//搜索设备;
		oSearchOcx.AddEventProc('SearchDeviceSuccess','callback(data);');
		oSearchOcx.AddEventProc('SettingStatus','autoSetIPcallBack(data);');
		searchFlush();
	})///
	$(window).resize(function(){ 
		set_contentMax();
	})
	var Language={'zh_CN':'中文','en_GB':'English'};
	var SplitScreenMode={'div1_1':'1分屏','div2_2':'4分屏','div6_1':'6分屏','div8_1':'8分屏','div3_3':'9分屏','div4_4':'16分屏','div5_5':'25分屏','div7_7':'49分屏','div8_8':'64分屏'}
	function FillCommonParmData(){ 
		var item = ['Language','AutoPollingTime','SplitScreenMode','AutoLogin','AutoSyncTime','AutoConnect','AutoFullscreen','BootFromStart'];
		for(i in item){
			var str = oCommonLibrary['get'+item[i]]();
			var obj = $('#'+item[i]+'_ID')
			if(obj[0].nodeName != 'INPUT'){
				obj.dataIntoHtml(str)
			}else{
				obj.dataIntoSelected(str);
			}

			if(item[i] =='Language' || item[i] =='SplitScreenMode'){  //语言转换
				$('span.'+item[i]).html(window[item[i]][str]);
				obj.val(str);
			}
		}

		$('#CommonParm input:checkbox').each(function(){ 
			$(this).toCheck();
		})
		$('#viewMod a').click(function(){
			$('#SplitScreenMode_ID').val('div'+$(this).html());
		})
	}
	var weeks = ['星期一','星期二','星期三','星期四','星期五','星期六','星期日']
	function FillRecordTimeData(){
		areaList2Ui('3');
		SettingRecordDoubleTimeParmSuccess();
		/*$('ul.week a').each(function(index){ 
			$(this).click(function(){
				$('#week').html($(this).html());
			})
		})*/
	}
	function initChannlrecTime(obj){
		var oTimes=$('#recordtime tr:lt(5)');
		var str = '<recordtime num="4">';
		var n = 0;
		for(i in obj.data()){ 
			n++;
			var data = obj.data()[i];
			var timeid = i.split('_')[1];
			var start = data.starttime.split(' ')[1];
			var end = data.endtime.split(' ')[1]
			var enable = Boolean(data.enable);
			oTimes.eq(n).find('input:checkbox').prop('checked',enable);
			oTimes.eq(n).find('input.timeid').val(timeid);
			oTimes.eq(n).find('div.timeInput:eq(0)').timeInput({'initTime':start});
			oTimes.eq(n).find('div.timeInput:eq(1)').timeInput({'initTime':end});
			str+='<num'+n+' recordtime_ID="'+timeid+'" starttime_ID="1970-01-01 '+start+'" endtime_ID="1970-01-01 '+end+'" enable_ID="'+enable.toString()+'" />'
		}
		str +='</recordtime>';
		$('#recordtimedouble_ID').val(str);
	}
	function initRecrodxml(){
		var str = '<recordtime num="4">';
		$('#RecordTime div.timeInput input').each(function(index){ 
			var warp = $(this).parent('div.timeInput').parent('td.td2');
			if(index%6 == 0){
				var timeid = warp.find('input:hidden').val();
				var start = warp.find('div.timeInput:eq(0)').gettime();
				var end = warp.find('div.timeInput:eq(1)').gettime();
				var enable = warp.prev('td.td1').find('input:checkbox').is(':checked');	
				str+='<num'+(parseInt(index/6)+1)+' recordtime_ID="'+timeid+'" starttime_ID="1970-01-01 '+start+'" endtime_ID="1970-01-01 '+end+'" enable_ID="'+enable.toString()+'" />'
			}
		})
		str +='</recordtime>';
		$('#recordtimedouble_ID').val(str);
	}
	function getrecrodxml(){ 
		$('tbody.synCheckboxClick input:checkbox').each(function(){
			$(this).click();
		})
	}
	// 一键添加
	function addAlldevIntoArea(){
		var devList = $('tbody.synCheckboxClick input:checkbox').prop('checked',true);
		initDevIntoAreaXml(devList,$('#adddeviceall_ID'));
	}
	//添加多台设备
	function adddoubdevIntoArea(){
		var devList = $('tbody.synCheckboxClick input:checked');
		initDevIntoAreaXml($('tbody.synCheckboxClick input:checked'),$('#adddevicedouble_ID'));
	}
	//初始化要添加到区域的XML信息
	function initDevIntoAreaXml (objList,obj){
			var oArea=$('div.dev_list:eq(0)')
			if(!oArea.find('span.sel')[0]){
				oArea.find('span').removeClass('sel');
				oArea.find('span.area:first').addClass('sel');
			}
			var areaID = oArea.find('span.sel').data('data')['area_id'];
			var str = '<devListInfo cut = "'+objList.length+'" area_id="'+areaID+'">';
			objList.each(function(){ 
				var data = $(this).parent('td').parent('tr').data('data');
				var dataStr = '<dev username="admin" password="" ';
				for(i in data){ 
					dataStr+=i+'="'+data[i]+'" ';
				}
				dataStr+=' />';
				str+=dataStr;
			});
			str+=' </devListInfo>';
			obj.val(str);
		}
	function FillStorageParmData(){
		var diskcheckbox = $('#StorageParm table table input:checkbox')
		var disks = oCommonLibrary.getEnableDisks().split(':');
		for(i in disks){ 
			diskcheckbox.each(function(){ 
				if(disks[i] == $(this).val()){ 
					$(this).prop('disabled',false);
				};
			})
		}
		var item = ['FilePackageSize','LoopRecording','DiskSpaceReservedSize']
		var useDisks = oCommonLibrary.getUseDisks().split(':');
		var clickedAbles = diskcheckbox.filter(function(){ 
			return !$(this).prop('disabled');
		})
		for( n in useDisks){ 
			clickedAbles.each(function(){ 
				$(this).dataIntoSelected(useDisks[n]);
			})
		}

		for( k in item){ 
			var str = oCommonLibrary['get'+item[k]]();
			var obj = $('#'+item[k]+'_ID');
			if(obj.is(':checkbox')){
				obj.dataIntoSelected(str);
			}else{ 
				obj.dataIntoVal(str).dataIntoHtml(str);
			}
		}

		clickedAbles.each(function(){
			$(this).click(function(){
				var checked = []; 
				clickedAbles.each(function(){ 
					$(this).is(':checked') == true && checked.push($(this).val());
					$('#UseDisks_ID').val(checked.join(':'));
				})
			})
		})
		$('#LoopRecording_ID').toCheck();
	}
	
	//分组区域添加到分组, 数据组织
	function SetChannelIntoGroupData(){
		var oChlList = $('div.dev_list:eq(0) span.sel.channel');
		var oArea = $('div.dev_list:eq(1) span.sel.group');
		var str = '<chlintogroup cut="'+oChlList.length+'" group_id="'+oArea.data('data')['group_id']+'">';
		oChlList.each(function(){ 
			var sChl = '<chlinfo ';
			var data = $(this).data('data')
			for(i in data){ 
				if(i == 'channel_name'){
					sChl+='channel_name_ID="'+$('#dev_'+data.dev_id).data('data').eseeid+'_chl_'+(parseInt(data.channel_number)+1)+'" ';	
				}else{
					sChl+=i+'_ID="'+data[i]+'" ';
				}
			}
			sChl+='/>';
			str+=sChl
		})
		str+='</chlintogroup>';
		$('#addchannelingroupdouble_ID').val(str);
	}
	function set_contentMax(){
		var W = $(window).width(),
			H = $(window).height(),
			now =0,
			oWarp ={};
		$('#set_content div.right').css({ 
			width:W - 250,
			height:H - 106
		}).find('div.right_content').each(function(index){
			if($(this).is(':visible')){
				now = index;
				oWarp = $(this);
			}
		})

		$('#set_content div.left').height(H - 106);
		if(now == 0){ 
			var main = $('#SerachDevList');
			main.css({ 
				height:H-270,
				width:W-600
			})
			main.find('thead td').not(':first,:last').width((main.width()-130)/2-2)
			if(main.width()>760){ 
				main.width(780);
			}
			$('#Allocation').css({
				top:main.height(),
				width:main.width()
			}).find('tbody .aa').width((main.width()-100)/2-20)

			$('div.dev_list').height(H/2-94)

			oWarp.find('div.action:eq(0)').css('left',main.width()-30);
			$('#left_list').css('left',main.width()+136);
		}
		$('#foot').css('top',H-28)
	}
	//用户设置方法 User Manage
	function userList2Ui(){
		$('#UserMan table.UserMan tbody input:hidden').val('');
		$('#UserMan table.UserMan tbody tr').not(':first').remove();
		var userList = oCommonLibrary.GetUserList();
		if(userList.length){  //避免数组为空的时候. 自己写的JS数组扩展方法引起 BUG;
			for(i in userList){
				var userlv = oCommonLibrary.GetUserLevel(userList[i]);
				var userCom = userLev[userlv]
				
				var data = {'username':userList[i],'userlv':userlv,'userCom':userCom}
				$('<tr><td>'+i+'</td><td>'+userList[i]+'</td><td>'+userCom+'</td></tr>').appendTo('#UserMan table.UserMan').data('data',data);
			}
		}		
	}
	
	function ShowUserOperateMenu(obj){  //显示弹出层 调整定位。
		var node = $('#'+obj+'');
		node.find('input:text,:password').val('');
		if(obj == 'menu3' || obj == 'confirm'){
			var str = $('table.UserMan input:hidden').val().split(',');
			if(str == ''){ 
				Confirm('please select user!!!');
				return false;
			}
			if(obj == 'menu3'){
				node.find('input:first').val(str[0]);
			}
		}
		objShowCenter(node);
	}

	function pwdTest(obj){
		var str = obj.val();
		if(str == '' || !/[\d\w_]{4,}$/.test(str)){
			Confirm('请用下划线数字字母组合且长度大于6位');
		}else{
			obj.attr('enable','1');
			valueIsSame($('#add_again_passwd'),$('#add_passwd'));
			valueIsSame($('#modify_again_passwd'),$('#modify_newpasswd'));
		}
	}
	function valueIsSame(obj,obj2){ 
		if(obj.val() && obj2.val() && obj.val() != obj2.val()){ 
			obj.attr('enable','0');
			obj2.attr('enable','0');
			Confirm('2次密码不一样');
			return;
		}else{ 
			obj.attr('enable','1')
			obj2.attr('enable','1')
		}
	}
	function showMenu(id,str){
		if(str){ 
			$('#'+id).find('p span').html(str);
		}
		$('#iframe').show();
		objShowCenter($('#'+id));
	}
	function initModifyMenu(){ 
		var oDevData = $('#SerachDevList tbody tr').filter(function(){ 
			return $(this).find('input:checkbox').is(':checked')
		}).eq(0).data('data');
	}
	function removeArry(obj,number){ 
		for(i in obj){ 
			if(obj[i] == number){ 
				obj.splice(i,1);
			}
		}
		return obj;
	}
//设备搜索. 设备设置. 分组设置. 区域设置.
function showContextMenu(y,x,obj){
	var menu = $('#menu0')
	menu.find('li').off();
	if(obj[0].nodeName == 'SPAN'){
		if(obj[0].id == 'area_0' || obj[0].id == 'group_0' ){
			$('#menu0 li:gt(2)').hide();
		}else if(obj.hasClass('group')){
			menu.find('li:lt(2)').hide();
		}else if(obj.hasClass('device')){ 
			menu.find('li:lt(3)').hide();
		}else if(obj.hasClass('channel')){ 
			menu.find('li').not(':eq(3)').hide();
			menu.find('li:eq(3)').show();
		}	
		menu.find('li:eq(3)').one('click',function(){
			showObjActBox('Modify',obj.attr('class').split(' ')[0]);
		})
		menu.find('li:last').one('click',function(){ 
			showObjActBox('Remove',obj.attr('class').split(' ')[0]);
		})
	}else{ 
		$('#menu0 li:gt(2)').hide();
	}
	menu.css({
		top:y,
		left:x,					
	}).show(10,function(){ 
		$(document).mouseup(function(event){
			event.stopPropagation();
			menu.hide();
			$(document).off();
		})
	});
}

//遮罩层和弹出框方法.
var trance = {'area':'区域','device':'设备','channel':'通道','group':'分组','Add':'增加','Remove':'删除','Modify':'修改','GroupChannelName':'通道下设备名字'};
function showObjActBox(action,objclass){  //右键弹出菜单UI调整
	var pObjClass = objclass == 'group' ? 'group':'area';
	var pObj = $('span.sel');
	if(action == 'Add'){ // 调整添加的父级对象
		if(!$('span.sel')[0] || !$('span.sel').hasClass(pObjClass)){
			pObj = $('span.'+pObjClass+':eq(0)');
		}
		if(objclass == 'group'){
			pObj = $('#group_0');
		}
	}else{ 
		if(!$('span.sel')[0]){
			$('span.'+objclass+':eq(0)').addClass('sel');
		}
	}
	if(action == 'Remove'){ 
		var obox = $('#confirm');
	}else{
		var obox = $('#'+objclass);
	}
	obox.find('p span').html(trance[action]+trance[objclass]);
	initActionBox(action,pObj,obox,objclass);
}
function initActionBox(action,pObj,obox,objclass){  //右键菜单数据填充.
	var data = pObj.data('data');
	//show(data);
	if(!data){ 
		Confirm('请选择一台设备!');
		return false;
	}
	var pObjType = firstUp(pObj.attr('class').split(' ')[0]);
	if(pObj.attr('id')=='g_channel_'+data.channel_id){
		pObjType = 'GroupChannelName';
		/*obox.find('input:text').attr('id','r_chl_group_name_ID');
	}else if(pObj.attr('id')=='channel_'+data.channel_id){ 
		obox.find('input:text').attr('id','channel_name_ID');*/
	}
	$('#'+action+pObjType+'_ok').show();
	/*if(pObj.parent('li').parent('ul').prev('span').hasClass('group')){ 
		$('#channel input:text').attr('id','r_chl_group_name_ID');
	}else{ 
		$('#channel input:text').attr('id','channel_name_ID');
	}*/
	for(i in data){
		if(i.match(objclass+'_name') && action == 'Remove'){
			$('#confirm h4').attr('id',i+'_ID').html('删除'+data[i]);
		}
		var str = ''
		if(data[i] != ''){ 
			str = data[i];
		}
		if($('#'+i+'_ID')[0]){ 
			$('#'+i+'_ID').val(str);
		}else{ 
			$('<input type="hidden" class="data" value="'+str+'" id="'+i+'_ID"/>').appendTo(obox);
		}
	}
	if(action == 'Add'){
		$('#'+action+firstUp(objclass)+'_ok').show();
		$('#'+objclass+'_name_ID').val('');
		$('#area #'+objclass+'_id_ID').remove();
		$('#group #'+objclass+'_id_ID').remove();
		$('#pid_ID').val(data['area_id']);
		obox.find('input.parent'+pObjType).val(data['area_name']);
	}
	objShowCenter(obox);
}
function cleanDev(){  //清空设备
	var arr = [];
	$('div.dev_list span.device').each(function(){
		arr.push($(this).data('data').dev_id);
	})
	$('#removedeviceall_ID').val(arr.join(','))
}
function setIP(){ //设置IP
	var oData = $('tbody.synCheckboxClick tr.sel').data('data')
	if(oSearchOcx.SetNetworkInfo(oData.SearchDeviceId_ID,$('#SearchIP_ID').val(),$('#SearchMask_ID').val(),$('#SearchGateway_ID').val(),oData.SearchMac_ID,$('#SearchHttpport_ID').val(),'admin','')){
		alert('IP设置失败');
	}else{
		setTimeout(searchFlush,2000);
	}
}
function autoSetIP(){  //批量分配IP
	var ipcList= $('#SerachDevList tr.IPC')
	var str = '<devnetworkInfo Num="'+ipcList.length+'">'
	ipcList.each(function(){
		var oIpcData = $(this).data('data');
		str+='<dev sDeviceID="'+oIpcData.SearchDeviceId_ID+'" sAddress="'+oIpcData.SearchIP_ID+'" sMask="'+oIpcData.SearchMask_ID+'" sGateway="'+oIpcData.SearchGateway_ID+'" sMac="'+oIpcData.SearchMac_ID+'" sPort="'+oIpcData.SearchHttpport_ID+'" sUsername="admin" sPassword=""/>'
	})
	str+='</devnetworkInfo>';
	$('#AutoSetNetworkInfoID').val(str);
	//alert($('#AutoSetNetworkInfoID').val());
	oSearchOcx.AutoSetNetworkInfo();
	setTimeout(searchFlush,2000);
	
}
function autoSetIPcallBack(data){
}
//devinfo
function disksSelectAll(){
	$('#StorageParm input:checkbox:lt(22)').click();
}